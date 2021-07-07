/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('parseHookNames', () => {
  let fetchMock;
  let inspectHooks;
  let parseHookNames;

  beforeEach(() => {
    jest.resetModules();

    jest.mock('source-map-support', () => {
      console.trace('source-map-support');
    });

    const {
      overrideFeatureFlags,
    } = require('react-devtools-shared/src/__tests__/utils');
    overrideFeatureFlags({enableHookNameParsing: true});

    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();

    inspectHooks = require('react-debug-tools/src/ReactDebugHooks')
      .inspectHooks;
    parseHookNames = require('../parseHookNames').default;

    // Jest (jest-runner?) configures Errors to automatically account for source maps.
    // This changes behavior between our tests and the browser.
    // To "fix" this, clear the prepareStackTrace() method on the Error object.
    delete Error.prepareStackTrace;

    fetchMock.mockIf(/.+$/, request => {
      const {resolve} = require('path');
      const url = request.url;
      if (url.endsWith('js.map')) {
        // Source maps are relative URLs (e.g. "path/to/Exmaple.js" specifies "Exmaple.js.map").
        const sourceMapURL = resolve(
          __dirname,
          '__source__',
          '__compiled__',
          'external',
          url,
        );
        return Promise.resolve(requireText(sourceMapURL, 'utf8'));
      } else {
        return Promise.resolve(requireText(url, 'utf8'));
      }
    });

    // Mock out portion of browser API used by parseHookNames to initialize "source-map".
    global.chrome = {
      extension: {
        getURL: jest.fn((...args) => {
          const {join} = require('path');
          return join(
            __dirname,
            '..',
            '..',
            'node_modules',
            'source-map',
            'lib',
            'mappings.wasm',
          );
        }),
      },
    };
  });

  afterEach(() => {
    fetch.resetMocks();
  });

  function expectHookNamesToEqual(map, expectedNamesArray) {
    // Slightly hacky since it relies on the iterable order of values()
    expect(Array.from(map.values())).toEqual(expectedNamesArray);
  }

  function requireText(path, encoding) {
    const {readFileSync} = require('fs');
    return readFileSync(path, encoding);
  }

  async function getHookNamesForComponent(Component, props = {}) {
    const hooksTree = inspectHooks(Component, props, undefined, true);
    const hookNames = await parseHookNames(hooksTree);
    return hookNames;
  }

  it('should parse names for useState()', async () => {
    const React = require('react');
    const {useState} = React;
    function Component(props) {
      const [foo] = useState(true);
      const bar = useState(true);
      const [baz] = React.useState(true);
      return `${foo}-${bar}-${baz}`;
    }

    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, ['foo', 'bar', 'baz']);
  });

  it('should parse names for useReducer()', async () => {
    const React = require('react');
    const {useReducer} = React;
    function Component(props) {
      const [foo] = useReducer(true);
      const [bar] = useReducer(true);
      const [baz] = React.useReducer(true);
      return `${foo}-${bar}-${baz}`;
    }

    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, ['foo', 'bar', 'baz']);
  });

  it('should return null for hooks without names like useEffect', async () => {
    const React = require('react');
    const {useEffect} = React;
    function Component(props) {
      useEffect(() => {});
      React.useLayoutEffect(() => () => {});
      return null;
    }

    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, []); // No hooks with names
  });

  it('should parse names for custom hooks', async () => {
    const {useDebugValue, useState} = require('react');
    function useCustomHookOne() {
      // DebugValue hook should not appear in log.
      useDebugValue('example');
      return true;
    }
    function useCustomHookTwo() {
      const [baz, setBaz] = useState(true);
      return [baz, setBaz];
    }
    function Component(props) {
      const foo = useCustomHookOne();
      // This cae is ignored;
      // the meaning of a tuple assignment for a custom hook is unclear.
      const [bar] = useCustomHookTwo();
      return `${foo}-${bar}`;
    }

    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, [
      'foo',
      null, // Custom hooks can have names, but not when using destructuring.
      'baz',
    ]);
  });

  it('should return null for custom hooks without explicit names', async () => {
    const {useDebugValue} = require('react');
    function useCustomHookOne() {
      // DebugValue hook should not appear in log.
      useDebugValue('example');
    }
    function useCustomHookTwo() {
      // DebugValue hook should not appear in log.
      useDebugValue('example');
      return [true];
    }
    function Component(props) {
      useCustomHookOne();
      const [bar] = useCustomHookTwo();
      return bar;
    }

    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, [
      null, // Custom hooks can have names, but this one does not even return a value.
      null, // Custom hooks can have names, but not when using destructuring.
    ]);
  });

  describe('inline and external source maps', () => {
    it('should work for simple components', async () => {
      async function test(path) {
        const Component = require(path).Component;
        const hookNames = await getHookNamesForComponent(Component);
        expectHookNamesToEqual(hookNames, [
          'count', // useState
        ]);
      }

      await test('./__source__/Example'); // original source (uncompiled)
      await test('./__source__/__compiled__/inline/Example'); // inline source map
      await test('./__source__/__compiled__/external/Example'); // external source map
    });

    it('should work with more complex files and components', async () => {
      async function test(path) {
        const components = require(path);

        let hookNames = await getHookNamesForComponent(components.List);
        expectHookNamesToEqual(hookNames, [
          'newItemText', // useState
          'items', // useState
          'uid', // useState
          'handleClick', // useCallback
          'handleKeyPress', // useCallback
          'handleChange', // useCallback
          'removeItem', // useCallback
          'toggleItem', // useCallback
        ]);

        hookNames = await getHookNamesForComponent(components.ListItem, {
          item: {},
        });
        expectHookNamesToEqual(hookNames, [
          'handleDelete', // useCallback
          'handleToggle', // useCallback
        ]);
      }

      await test('./__source__/ToDoList'); // original source (uncompiled)
      await test('./__source__/__compiled__/inline/ToDoList'); // inline source map
      await test('./__source__/__compiled__/external/ToDoList'); // external source map
    });

    it('should work for custom hook', async () => {
      async function test(path) {
        const Component = require(path).Component;
        const hookNames = await getHookNamesForComponent(Component);
        expectHookNamesToEqual(hookNames, [
          'count', // useState()
          'isDarkMode', // useIsDarkMode()
          'isDarkMode', // useIsDarkMode -> useState()
        ]);
      }

      await test('./__source__/ComponentWithCustomHook'); // original source (uncompiled)
      await test('./__source__/__compiled__/inline/ComponentWithCustomHook'); // inline source map
      await test('./__source__/__compiled__/external/ComponentWithCustomHook'); // external source map
    });

    it('should work for external hooks', async () => {
      async function test(path) {
        const Component = require(path).Component;
        const hookNames = await getHookNamesForComponent(Component);
        expectHookNamesToEqual(hookNames, [
          'theme', // useTheme()
          'theme', // useContext()
        ]);
      }

      // We can't test the uncompiled source here, because it either needs to get transformed,
      // which would break the source mapping, or the import statements will fail.

      await test(
        './__source__/__compiled__/inline/ComponentWithExternalCustomHooks',
      ); // inline source map
      await test(
        './__source__/__compiled__/external/ComponentWithExternalCustomHooks',
      ); // external source map
    });

    // TODO Inline require (e.g. require("react").useState()) isn't supported yet.
    // Maybe this isn't an important use case to support,
    // since inline requires are most likely to exist in compiled source (if at all).
    xit('should work for inline requires', async () => {
      async function test(path) {
        const Component = require(path).Component;
        const hookNames = await getHookNamesForComponent(Component);
        expectHookNamesToEqual(hookNames, [
          'count', // useState()
        ]);
      }

      await test('./__source__/InlineRequire'); // original source (uncompiled)
      await test('./__source__/__compiled__/inline/InlineRequire'); // inline source map
      await test('./__source__/__compiled__/external/InlineRequire'); // external source map
    });
  });
});
