/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Note that this test uses React components declared in the "__source__" directory.
// This is done to control if and how the code is transformed at runtime.
// Do not declare test components within this test file as it is very fragile.

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
    // Ideally we would clear the prepareStackTrace() method on the Error object,
    // but Node falls back to looking for it on the main context's Error constructor,
    // which may still be patched.
    // To ensure we get the default behavior, override prepareStackTrace ourselves.
    // NOTE: prepareStackTrace is called from the error.stack getter, but the getter
    // has a recursion breaker which falls back to the default behavior.
    Error.prepareStackTrace = (error, trace) => {
      return error.stack;
    };

    fetchMock.mockIf(/.+$/, request => {
      return Promise.resolve(requireText(request.url, 'utf8'));
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
    const Component = require('./__source__/__untransformed__/ComponentWithUseState')
      .Component;
    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, ['foo', 'bar', 'baz']);
  });

  it('should parse names for useReducer()', async () => {
    const Component = require('./__source__/__untransformed__/ComponentWithUseReducer')
      .Component;
    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, ['foo', 'bar', 'baz']);
  });

  it('should skip loading source files for unnamed hooks like useEffect', async () => {
    const Component = require('./__source__/__untransformed__/ComponentWithUseEffect')
      .Component;

    // Since this component contains only unnamed hooks, the source code should not even be loaded.
    fetchMock.mockIf(/.+$/, request => {
      throw Error(`Unexpected file request for "${request.url}"`);
    });

    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, []); // No hooks with names
  });

  it('should skip loading source files for unnamed hooks like useEffect (alternate)', async () => {
    const Component = require('./__source__/__untransformed__/ComponentWithExternalUseEffect')
      .Component;

    fetchMock.mockIf(/.+$/, request => {
      // Since th custom hook contains only unnamed hooks, the source code should not be loaded.
      if (request.url.endsWith('useCustom.js')) {
        throw Error(`Unexpected file request for "${request.url}"`);
      }
      return Promise.resolve(requireText(request.url, 'utf8'));
    });

    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, ['count', null]); // No hooks with names
  });

  it('should parse names for custom hooks', async () => {
    const Component = require('./__source__/__untransformed__/ComponentWithNamedCustomHooks')
      .Component;
    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, [
      'foo',
      null, // Custom hooks can have names, but not when using destructuring.
      'baz',
    ]);
  });

  it('should return null for custom hooks without explicit names', async () => {
    const Component = require('./__source__/__untransformed__/ComponentWithUnnamedCustomHooks')
      .Component;
    const hookNames = await getHookNamesForComponent(Component);
    expectHookNamesToEqual(hookNames, [
      null, // Custom hooks can have names, but this one does not even return a value.
      null, // Custom hooks can have names, but not when using destructuring.
    ]);
  });

  describe('inline, external and bundle source maps', () => {
    it('should work for simple components', async () => {
      async function test(path, name = 'Component') {
        const Component = require(path)[name];
        const hookNames = await getHookNamesForComponent(Component);
        expectHookNamesToEqual(hookNames, [
          'count', // useState
        ]);
      }

      await test('./__source__/Example'); // original source (uncompiled)
      await test('./__source__/__compiled__/inline/Example'); // inline source map
      await test('./__source__/__compiled__/external/Example'); // external source map
      await test('./__source__/__compiled__/bundle/index', 'Example'); // bundle source map
    });

    it('should work with more complex files and components', async () => {
      async function test(path, name = undefined) {
        const components = name != null ? require(path)[name] : require(path);

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
      await test('./__source__/__compiled__/bundle', 'ToDoList'); // bundle source map
    });

    it('should work for custom hook', async () => {
      async function test(path, name = 'Component') {
        const Component = require(path)[name];
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
      await test('./__source__/__compiled__/bundle', 'ComponentWithCustomHook'); // bundle source map
    });

    it('should work for external hooks', async () => {
      async function test(path, name = 'Component') {
        const Component = require(path)[name];
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
      await test(
        './__source__/__compiled__/bundle',
        'ComponentWithExternalCustomHooks',
      ); // bundle source map
    });

    it('should work when multiple hooks are on a line', async () => {
      async function test(path, name = 'Component') {
        const Component = require(path)[name];
        const hookNames = await getHookNamesForComponent(Component);
        expectHookNamesToEqual(hookNames, [
          'a', // useContext()
          'b', // useContext()
          'c', // useContext()
          'd', // useContext()
        ]);
      }

      await test(
        './__source__/__compiled__/inline/ComponentWithMultipleHooksPerLine',
      ); // inline source map
      await test(
        './__source__/__compiled__/external/ComponentWithMultipleHooksPerLine',
      ); // external source map
      // await test(
      //   './__source__/__compiled__/bundle',
      //   'ComponentWithMultipleHooksPerLine',
      // ); // bundle source map
    });

    // TODO Inline require (e.g. require("react").useState()) isn't supported yet.
    // Maybe this isn't an important use case to support,
    // since inline requires are most likely to exist in compiled source (if at all).
    xit('should work for inline requires', async () => {
      async function test(path, name = 'Component') {
        const Component = require(path)[name];
        const hookNames = await getHookNamesForComponent(Component);
        expectHookNamesToEqual(hookNames, [
          'count', // useState()
        ]);
      }

      await test('./__source__/InlineRequire'); // original source (uncompiled)
      await test('./__source__/__compiled__/inline/InlineRequire'); // inline source map
      await test('./__source__/__compiled__/external/InlineRequire'); // external source map
      await test('./__source__/__compiled__/bundle', 'InlineRequire'); // bundle source map
    });
  });
});
