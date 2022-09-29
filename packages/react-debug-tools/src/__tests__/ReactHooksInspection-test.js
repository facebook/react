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
      const [state] = React.useState('hello world');
      return <div>{state}</div>;
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        isStateEditable: true,
        id: 0,
        name: 'State',
        value: 'hello world',
        subHooks: [],
      },
    ]);
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
    expect(tree).toEqual([
      {
        isStateEditable: false,
        id: null,
        name: 'Custom',
        value: __DEV__ ? 'custom hook label' : undefined,
        subHooks: [
          {
            isStateEditable: true,
            id: 0,
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
    expect(tree).toEqual([
      {
        isStateEditable: false,
        id: null,
        name: 'Custom',
        value: undefined,
        subHooks: [
          {
            isStateEditable: true,
            id: 0,
            name: 'State',
            subHooks: [],
            value: 'hello',
          },
          {
            isStateEditable: false,
            id: 1,
            name: 'Effect',
            subHooks: [],
            value: effect,
          },
        ],
      },
      {
        isStateEditable: false,
        id: null,
        name: 'Custom',
        value: undefined,
        subHooks: [
          {
            isStateEditable: true,
            id: 2,
            name: 'State',
            value: 'world',
            subHooks: [],
          },
          {
            isStateEditable: false,
            id: 3,
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
    expect(tree).toEqual([
      {
        isStateEditable: false,
        id: null,
        name: 'Bar',
        value: undefined,
        subHooks: [
          {
            isStateEditable: false,
            id: null,
            name: 'Custom',
            value: undefined,
            subHooks: [
              {
                isStateEditable: true,
                id: 0,
                name: 'Reducer',
                value: 'hello',
                subHooks: [],
              },
              {
                isStateEditable: false,
                id: 1,
                name: 'Effect',
                value: effect,
                subHooks: [],
              },
            ],
          },
          {
            isStateEditable: false,
            id: 2,
            name: 'LayoutEffect',
            value: effect,
            subHooks: [],
          },
        ],
      },
      {
        isStateEditable: false,
        id: null,
        name: 'Baz',
        value: undefined,
        subHooks: [
          {
            isStateEditable: false,
            id: 3,
            name: 'LayoutEffect',
            value: effect,
            subHooks: [],
          },
          {
            isStateEditable: false,
            id: null,
            name: 'Custom',
            subHooks: [
              {
                isStateEditable: true,
                id: 4,
                name: 'Reducer',
                subHooks: [],
                value: 'world',
              },
              {
                isStateEditable: false,
                id: 5,
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
    const MyContext = React.createContext('default');
    function Foo(props) {
      const value = React.useContext(MyContext);
      return <div>{value}</div>;
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        isStateEditable: false,
        id: null,
        name: 'Context',
        value: 'default',
        subHooks: [],
      },
    ]);
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
      expect(tree).toEqual([
        {
          isStateEditable: false,
          id: null,
          name: 'Custom',
          value: __DEV__ ? 'bar:123' : undefined,
          subHooks: [
            {
              isStateEditable: true,
              id: 0,
              name: 'State',
              subHooks: [],
              value: 0,
            },
          ],
        },
      ]);
    });
  });
});
