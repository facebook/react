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

    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();

    inspectHooks = require('react-debug-tools/src/ReactDebugHooks')
      .inspectHooks;
    parseHookNames = require('../parseHookNames').default;

    fetchMock.mockIf(/.+$/, request => {
      const {resolve} = require('path');
      const url = request.url;
      if (url.endsWith('/__tests__/parseHookNames-test.js')) {
        // parseHookNames will try to load the source file,
        // which for some of these tests will be this test file itself.
        return Promise.resolve(requireText(url, 'utf8'));
      } else if (
        url.includes('packages/react-devtools-extensions/src/__tests__/')
      ) {
        return Promise.resolve(requireText(url, 'utf8'));
      } else if (url.endsWith('js.map')) {
        const sourceMapURL = resolve(
          __dirname,
          '__source__',
          '__compiled__',
          'external',
          url,
        );
        return Promise.resolve(requireText(sourceMapURL, 'utf8'));
      } else {
        console.warn('Unexpected fetch:', request);
        return null;
      }
    });

    // Mock out portion of browser API used by SourceMap parser.
    // TODO (named hooks) Inject this bit from main.js (so we can inject from test too).
    global.chrome = {
      extension: {
        getURL: jest.fn((...args) => {
          const {join} = require('path');
          return join(__dirname, '..', '..', 'source-map.wasm');
        }),
      },
    };
  });

  afterEach(() => {
    fetch.resetMocks();
  });

  function requireText(path, encoding) {
    const {readFileSync} = require('fs');
    return readFileSync(path, encoding);
  }

  async function getHookNamesForComponent(Component) {
    const hooksTree = inspectHooks(Component, {}, undefined, true);
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
    expect(hookNames).toEqual(['foo', 'bar', 'baz']);
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
    expect(hookNames).toEqual(['foo', 'bar', 'baz']);
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
    expect(hookNames).toEqual([null, null]);
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
    expect(hookNames).toEqual(['foo', null, 'baz']);
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
    expect(hookNames).toEqual([null, null]);
  });

  it('should parse and load names for external and inline source maps', async () => {
    async function test(path) {
      const Component = require(path).default;
      const hookNames = await getHookNamesForComponent(Component);
      expect(hookNames).toEqual([
        'memoizedFoo', // useMemo
        null, // useEffect
        'custom', // useCustomHook
        'stateValue', // useCustomHook -> useState
      ]);
    }

    await test('./__source__/SimpleComponent'); // original source (uncompiled)
    await test('./__source__/__compiled__/inline/SimpleComponent'); // inline source map
    await test('./__source__/__compiled__/external/SimpleComponent'); // external source map
  });
});
