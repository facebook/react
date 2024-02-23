/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactDebugTools;

function normalizeSourceLoc(tree) {
  tree.forEach(node => {
    if (node.hookSource) {
      node.hookSource.fileName = '**';
      node.hookSource.lineNumber = 0;
      node.hookSource.columnNumber = 0;
    }
    normalizeSourceLoc(node.subHooks);
  });
  return tree;
}

describe('ReactHooksInspection', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDebugTools = require('react-debug-tools');
  });

  it('should inspect a simple useState hook', () => {
    function Foo(props) {
      const [state] = React.useState('hello world');
      return <div>{state}</div>;
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
      [
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": 0,
          "isStateEditable": true,
          "name": "State",
          "subHooks": [],
          "value": "hello world",
        },
      ]
    `);
  });

  it('should inspect a simple custom hook', () => {
    function useCustom(value) {
      const [state] = React.useState(value);
      React.useDebugValue('custom hook label');
      return state;
    }
    function Foo(props) {
      const value = useCustom('hello world');
      return <div>{value}</div>;
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    if (__DEV__) {
      expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
              [
                {
                  "debugInfo": null,
                  "hookSource": {
                    "columnNumber": 0,
                    "fileName": "**",
                    "functionName": "Foo",
                    "lineNumber": 0,
                  },
                  "id": null,
                  "isStateEditable": false,
                  "name": "Custom",
                  "subHooks": [
                    {
                      "debugInfo": null,
                      "hookSource": {
                        "columnNumber": 0,
                        "fileName": "**",
                        "functionName": "useCustom",
                        "lineNumber": 0,
                      },
                      "id": 0,
                      "isStateEditable": true,
                      "name": "State",
                      "subHooks": [],
                      "value": "hello world",
                    },
                  ],
                  "value": "custom hook label",
                },
              ]
          `);
    } else {
      expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
        [
          {
            "debugInfo": null,
            "hookSource": {
              "columnNumber": 0,
              "fileName": "**",
              "functionName": "Foo",
              "lineNumber": 0,
            },
            "id": null,
            "isStateEditable": false,
            "name": "Custom",
            "subHooks": [
              {
                "debugInfo": null,
                "hookSource": {
                  "columnNumber": 0,
                  "fileName": "**",
                  "functionName": "useCustom",
                  "lineNumber": 0,
                },
                "id": 0,
                "isStateEditable": true,
                "name": "State",
                "subHooks": [],
                "value": "hello world",
              },
            ],
            "value": undefined,
          },
        ]
      `);
    }
  });

  it('should inspect a tree of multiple hooks', () => {
    function effect() {}
    function useCustom(value) {
      const [state] = React.useState(value);
      React.useEffect(effect);
      return state;
    }
    function Foo(props) {
      const value1 = useCustom('hello');
      const value2 = useCustom('world');
      return (
        <div>
          {value1} {value2}
        </div>
      );
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
      [
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Custom",
          "subHooks": [
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useCustom",
                "lineNumber": 0,
              },
              "id": 0,
              "isStateEditable": true,
              "name": "State",
              "subHooks": [],
              "value": "hello",
            },
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useCustom",
                "lineNumber": 0,
              },
              "id": 1,
              "isStateEditable": false,
              "name": "Effect",
              "subHooks": [],
              "value": [Function],
            },
          ],
          "value": undefined,
        },
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Custom",
          "subHooks": [
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useCustom",
                "lineNumber": 0,
              },
              "id": 2,
              "isStateEditable": true,
              "name": "State",
              "subHooks": [],
              "value": "world",
            },
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useCustom",
                "lineNumber": 0,
              },
              "id": 3,
              "isStateEditable": false,
              "name": "Effect",
              "subHooks": [],
              "value": [Function],
            },
          ],
          "value": undefined,
        },
      ]
    `);
  });

  it('should inspect a tree of multiple levels of hooks', () => {
    function effect() {}
    function useCustom(value) {
      const [state] = React.useReducer((s, a) => s, value);
      React.useEffect(effect);
      return state;
    }
    function useBar(value) {
      const result = useCustom(value);
      React.useLayoutEffect(effect);
      return result;
    }
    function useBaz(value) {
      React.useLayoutEffect(effect);
      const result = useCustom(value);
      return result;
    }
    function Foo(props) {
      const value1 = useBar('hello');
      const value2 = useBaz('world');
      return (
        <div>
          {value1} {value2}
        </div>
      );
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
      [
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Bar",
          "subHooks": [
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useBar",
                "lineNumber": 0,
              },
              "id": null,
              "isStateEditable": false,
              "name": "Custom",
              "subHooks": [
                {
                  "debugInfo": null,
                  "hookSource": {
                    "columnNumber": 0,
                    "fileName": "**",
                    "functionName": "useCustom",
                    "lineNumber": 0,
                  },
                  "id": 0,
                  "isStateEditable": true,
                  "name": "Reducer",
                  "subHooks": [],
                  "value": "hello",
                },
                {
                  "debugInfo": null,
                  "hookSource": {
                    "columnNumber": 0,
                    "fileName": "**",
                    "functionName": "useCustom",
                    "lineNumber": 0,
                  },
                  "id": 1,
                  "isStateEditable": false,
                  "name": "Effect",
                  "subHooks": [],
                  "value": [Function],
                },
              ],
              "value": undefined,
            },
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useBar",
                "lineNumber": 0,
              },
              "id": 2,
              "isStateEditable": false,
              "name": "LayoutEffect",
              "subHooks": [],
              "value": [Function],
            },
          ],
          "value": undefined,
        },
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Baz",
          "subHooks": [
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useBaz",
                "lineNumber": 0,
              },
              "id": 3,
              "isStateEditable": false,
              "name": "LayoutEffect",
              "subHooks": [],
              "value": [Function],
            },
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useBaz",
                "lineNumber": 0,
              },
              "id": null,
              "isStateEditable": false,
              "name": "Custom",
              "subHooks": [
                {
                  "debugInfo": null,
                  "hookSource": {
                    "columnNumber": 0,
                    "fileName": "**",
                    "functionName": "useCustom",
                    "lineNumber": 0,
                  },
                  "id": 4,
                  "isStateEditable": true,
                  "name": "Reducer",
                  "subHooks": [],
                  "value": "world",
                },
                {
                  "debugInfo": null,
                  "hookSource": {
                    "columnNumber": 0,
                    "fileName": "**",
                    "functionName": "useCustom",
                    "lineNumber": 0,
                  },
                  "id": 5,
                  "isStateEditable": false,
                  "name": "Effect",
                  "subHooks": [],
                  "value": [Function],
                },
              ],
              "value": undefined,
            },
          ],
          "value": undefined,
        },
      ]
    `);
  });

  it('should inspect the default value using the useContext hook', () => {
    const MyContext = React.createContext('default');
    function Foo(props) {
      const value = React.useContext(MyContext);
      return <div>{value}</div>;
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
      [
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Context",
          "subHooks": [],
          "value": "default",
        },
      ]
    `);
  });

  it('should support an injected dispatcher', () => {
    const initial = {
      useState() {
        throw new Error("Should've been proxied");
      },
    };
    let current = initial;
    let getterCalls = 0;
    const setterCalls = [];
    const FakeDispatcherRef = {
      get current() {
        getterCalls++;
        return current;
      },
      set current(value) {
        setterCalls.push(value);
        current = value;
      },
    };

    function Foo(props) {
      const [state] = FakeDispatcherRef.current.useState('hello world');
      return <div>{state}</div>;
    }

    ReactDebugTools.inspectHooks(Foo, {}, FakeDispatcherRef);

    expect(getterCalls).toBe(2);
    expect(setterCalls).toHaveLength(2);
    expect(setterCalls[0]).not.toBe(initial);
    expect(setterCalls[1]).toBe(initial);
  });

  it('should inspect use() calls for Promise and Context', async () => {
    const MyContext = React.createContext('hi');
    const promise = Promise.resolve('world');
    await promise;
    promise.status = 'fulfilled';
    promise.value = 'world';
    promise._debugInfo = [{name: 'Hello'}];

    function useCustom() {
      const value = React.use(promise);
      const [state] = React.useState(value);
      return state;
    }
    function Foo(props) {
      const value1 = React.use(MyContext);
      const value2 = useCustom();
      return (
        <div>
          {value1} {value2}
        </div>
      );
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
      [
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Context",
          "subHooks": [],
          "value": "hi",
        },
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Custom",
          "subHooks": [
            {
              "debugInfo": [
                {
                  "name": "Hello",
                },
              ],
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useCustom",
                "lineNumber": 0,
              },
              "id": null,
              "isStateEditable": false,
              "name": "Promise",
              "subHooks": [],
              "value": "world",
            },
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "useCustom",
                "lineNumber": 0,
              },
              "id": 0,
              "isStateEditable": true,
              "name": "State",
              "subHooks": [],
              "value": "world",
            },
          ],
          "value": undefined,
        },
      ]
    `);
  });

  it('should inspect use() calls for unresolved Promise', () => {
    const promise = Promise.resolve('hi');

    function Foo(props) {
      const value = React.use(promise);
      return <div>{value}</div>;
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
      [
        {
          "debugInfo": null,
          "hookSource": {
            "columnNumber": 0,
            "fileName": "**",
            "functionName": "Foo",
            "lineNumber": 0,
          },
          "id": null,
          "isStateEditable": false,
          "name": "Unresolved",
          "subHooks": [],
          "value": Promise {},
        },
      ]
    `);
  });

  describe('useDebugValue', () => {
    it('should be ignored when called outside of a custom hook', () => {
      function Foo(props) {
        React.useDebugValue('this is invalid');
        return null;
      }
      const tree = ReactDebugTools.inspectHooks(Foo, {});
      expect(tree).toHaveLength(0);
    });

    it('should support an optional formatter function param', () => {
      function useCustom() {
        React.useDebugValue({bar: 123}, object => `bar:${object.bar}`);
        React.useState(0);
      }
      function Foo(props) {
        useCustom();
        return null;
      }
      const tree = ReactDebugTools.inspectHooks(Foo, {});
      if (__DEV__) {
        expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
                  [
                    {
                      "debugInfo": null,
                      "hookSource": {
                        "columnNumber": 0,
                        "fileName": "**",
                        "functionName": "Foo",
                        "lineNumber": 0,
                      },
                      "id": null,
                      "isStateEditable": false,
                      "name": "Custom",
                      "subHooks": [
                        {
                          "debugInfo": null,
                          "hookSource": {
                            "columnNumber": 0,
                            "fileName": "**",
                            "functionName": "useCustom",
                            "lineNumber": 0,
                          },
                          "id": 0,
                          "isStateEditable": true,
                          "name": "State",
                          "subHooks": [],
                          "value": 0,
                        },
                      ],
                      "value": "bar:123",
                    },
                  ]
              `);
      } else {
        expect(normalizeSourceLoc(tree)).toMatchInlineSnapshot(`
          [
            {
              "debugInfo": null,
              "hookSource": {
                "columnNumber": 0,
                "fileName": "**",
                "functionName": "Foo",
                "lineNumber": 0,
              },
              "id": null,
              "isStateEditable": false,
              "name": "Custom",
              "subHooks": [
                {
                  "debugInfo": null,
                  "hookSource": {
                    "columnNumber": 0,
                    "fileName": "**",
                    "functionName": "useCustom",
                    "lineNumber": 0,
                  },
                  "id": 0,
                  "isStateEditable": true,
                  "name": "State",
                  "subHooks": [],
                  "value": 0,
                },
              ],
              "value": undefined,
            },
          ]
        `);
      }
    });
  });
});
