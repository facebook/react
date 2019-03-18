/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

describe('ReactHooksInspection', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDebugTools = require('react-debug-tools');
  });

  it('should inspect a simple useState hook', () => {
    function Foo(props) {
      let [state] = React.useState('hello world');
      return <div>{state}</div>;
    }
    let tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        name: 'State',
        value: 'hello world',
        subHooks: [],
      },
    ]);
  });

  it('should inspect a simple custom hook', () => {
    function useCustom(value) {
      let [state] = React.useState(value);
      React.useDebugValue('custom hook label');
      return state;
    }
    function Foo(props) {
      let value = useCustom('hello world');
      return <div>{value}</div>;
    }
    let tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        name: 'Custom',
        value: __DEV__ ? 'custom hook label' : undefined,
        subHooks: [
          {
            name: 'State',
            value: 'hello world',
            subHooks: [],
          },
        ],
      },
    ]);
  });

  it('should inspect a tree of multiple hooks', () => {
    function effect() {}
    function useCustom(value) {
      let [state] = React.useState(value);
      React.useEffect(effect);
      return state;
    }
    function Foo(props) {
      let value1 = useCustom('hello');
      let value2 = useCustom('world');
      return (
        <div>
          {value1} {value2}
        </div>
      );
    }
    let tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        name: 'Custom',
        value: undefined,
        subHooks: [
          {
            name: 'State',
            subHooks: [],
            value: 'hello',
          },
          {
            name: 'Effect',
            subHooks: [],
            value: effect,
          },
        ],
      },
      {
        name: 'Custom',
        value: undefined,
        subHooks: [
          {
            name: 'State',
            value: 'world',
            subHooks: [],
          },
          {
            name: 'Effect',
            value: effect,
            subHooks: [],
          },
        ],
      },
    ]);
  });

  it('should inspect a tree of multiple levels of hooks', () => {
    function effect() {}
    function useCustom(value) {
      let [state] = React.useReducer((s, a) => s, value);
      React.useEffect(effect);
      return state;
    }
    function useBar(value) {
      let result = useCustom(value);
      React.useLayoutEffect(effect);
      return result;
    }
    function useBaz(value) {
      React.useLayoutEffect(effect);
      let result = useCustom(value);
      return result;
    }
    function Foo(props) {
      let value1 = useBar('hello');
      let value2 = useBaz('world');
      return (
        <div>
          {value1} {value2}
        </div>
      );
    }
    let tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        name: 'Bar',
        value: undefined,
        subHooks: [
          {
            name: 'Custom',
            value: undefined,
            subHooks: [
              {
                name: 'Reducer',
                value: 'hello',
                subHooks: [],
              },
              {
                name: 'Effect',
                value: effect,
                subHooks: [],
              },
            ],
          },
          {
            name: 'LayoutEffect',
            value: effect,
            subHooks: [],
          },
        ],
      },
      {
        name: 'Baz',
        value: undefined,
        subHooks: [
          {
            name: 'LayoutEffect',
            value: effect,
            subHooks: [],
          },
          {
            name: 'Custom',
            subHooks: [
              {
                name: 'Reducer',
                subHooks: [],
                value: 'world',
              },
              {
                name: 'Effect',
                subHooks: [],
                value: effect,
              },
            ],
            value: undefined,
          },
        ],
      },
    ]);
  });

  it('should inspect the default value using the useContext hook', () => {
    let MyContext = React.createContext('default');
    function Foo(props) {
      let value = React.useContext(MyContext);
      return <div>{value}</div>;
    }
    let tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        name: 'Context',
        value: 'default',
        subHooks: [],
      },
    ]);
  });

  it('should support an injected dispatcher', () => {
    function Foo(props) {
      let [state] = React.useState('hello world');
      return <div>{state}</div>;
    }

    let initial = {};
    let current = initial;
    let getterCalls = 0;
    let setterCalls = [];
    let FakeDispatcherRef = {
      get current() {
        getterCalls++;
        return current;
      },
      set current(value) {
        setterCalls.push(value);
        current = value;
      },
    };

    expect(() => {
      ReactDebugTools.inspectHooks(Foo, {}, FakeDispatcherRef);
    }).toThrow(
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
    );

    expect(getterCalls).toBe(1);
    expect(setterCalls).toHaveLength(2);
    expect(setterCalls[0]).not.toBe(initial);
    expect(setterCalls[1]).toBe(initial);
  });

  describe('useDebugValue', () => {
    it('should be ignored when called outside of a custom hook', () => {
      function Foo(props) {
        React.useDebugValue('this is invalid');
        return null;
      }
      let tree = ReactDebugTools.inspectHooks(Foo, {});
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
      let tree = ReactDebugTools.inspectHooks(Foo, {});
      expect(tree).toEqual([
        {
          name: 'Custom',
          value: __DEV__ ? 'bar:123' : undefined,
          subHooks: [{name: 'State', subHooks: [], value: 0}],
        },
      ]);
    });
  });
});
