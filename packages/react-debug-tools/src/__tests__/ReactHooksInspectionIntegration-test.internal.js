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
let ReactTestRenderer;
let ReactDebugTools;

describe('ReactHooksInspectionIntergration', () => {
  beforeEach(() => {
    jest.resetModules();
    let ReactFeatureFlags = require('shared/ReactFeatureFlags');
    // TODO: Switch this test to non-internal once the flag is on by default.
    ReactFeatureFlags.enableHooks = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    ReactDebugTools = require('react-debug-tools');
  });

  it('should inspect the current state of useState hooks', () => {
    let useState = React.useState;
    function Foo(props) {
      let [state1, setState1] = useState('hello');
      let [state2, setState2] = useState('world');
      return (
        <div onMouseDown={setState1} onMouseUp={setState2}>
          {state1} {state2}
        </div>
      );
    }
    let renderer = ReactTestRenderer.create(<Foo prop="prop" />);

    let childFiber = renderer.root.findByType(Foo)._currentFiber();
    let tree = ReactDebugTools.inspectHooksOfFiber(childFiber);
    expect(tree).toEqual([
      {name: 'State', value: 'hello', subHooks: []},
      {name: 'State', value: 'world', subHooks: []},
    ]);

    let {
      onMouseDown: setStateA,
      onMouseUp: setStateB,
    } = renderer.root.findByType('div').props;

    setStateA('Hi');

    childFiber = renderer.root.findByType(Foo)._currentFiber();
    tree = ReactDebugTools.inspectHooksOfFiber(childFiber);

    expect(tree).toEqual([
      {name: 'State', value: 'Hi', subHooks: []},
      {name: 'State', value: 'world', subHooks: []},
    ]);

    setStateB('world!');

    childFiber = renderer.root.findByType(Foo)._currentFiber();
    tree = ReactDebugTools.inspectHooksOfFiber(childFiber);

    expect(tree).toEqual([
      {name: 'State', value: 'Hi', subHooks: []},
      {name: 'State', value: 'world!', subHooks: []},
    ]);
  });

  it('should inspect the current state of all stateful hooks', () => {
    let outsideRef = React.createRef();
    function effect() {}
    function Foo(props) {
      let [state1, setState] = React.useState('a');
      let [state2, dispatch] = React.useReducer((s, a) => a.value, 'b');
      let ref = React.useRef('c');

      React.useLayoutEffect(effect);
      React.useEffect(effect);

      React.useImperativeHandle(
        outsideRef,
        () => {
          // Return a function so that jest treats them as non-equal.
          return function Instance() {};
        },
        [],
      );

      React.useMemo(() => state1 + state2, [state1]);

      function update() {
        setState('A');
        dispatch({value: 'B'});
        ref.current = 'C';
      }
      let memoizedUpdate = React.useCallback(update, []);
      return (
        <div onClick={memoizedUpdate}>
          {state1} {state2}
        </div>
      );
    }
    let renderer = ReactTestRenderer.create(<Foo prop="prop" />);

    let childFiber = renderer.root.findByType(Foo)._currentFiber();

    let {onClick: updateStates} = renderer.root.findByType('div').props;

    let tree = ReactDebugTools.inspectHooksOfFiber(childFiber);
    expect(tree).toEqual([
      {name: 'State', value: 'a', subHooks: []},
      {name: 'Reducer', value: 'b', subHooks: []},
      {name: 'Ref', value: 'c', subHooks: []},
      {name: 'LayoutEffect', value: effect, subHooks: []},
      {name: 'Effect', value: effect, subHooks: []},
      {name: 'ImperativeHandle', value: outsideRef.current, subHooks: []},
      {name: 'Memo', value: 'ab', subHooks: []},
      {name: 'Callback', value: updateStates, subHooks: []},
    ]);

    updateStates();

    childFiber = renderer.root.findByType(Foo)._currentFiber();
    tree = ReactDebugTools.inspectHooksOfFiber(childFiber);

    expect(tree).toEqual([
      {name: 'State', value: 'A', subHooks: []},
      {name: 'Reducer', value: 'B', subHooks: []},
      {name: 'Ref', value: 'C', subHooks: []},
      {name: 'LayoutEffect', value: effect, subHooks: []},
      {name: 'Effect', value: effect, subHooks: []},
      {name: 'ImperativeHandle', value: outsideRef.current, subHooks: []},
      {name: 'Memo', value: 'Ab', subHooks: []},
      {name: 'Callback', value: updateStates, subHooks: []},
    ]);
  });

  it('should inspect the value of the current provider in useContext', () => {
    let MyContext = React.createContext('default');
    function Foo(props) {
      let value = React.useContext(MyContext);
      return <div>{value}</div>;
    }
    let renderer = ReactTestRenderer.create(
      <MyContext.Provider value="contextual">
        <Foo prop="prop" />
      </MyContext.Provider>,
    );
    let childFiber = renderer.root.findByType(Foo)._currentFiber();
    let tree = ReactDebugTools.inspectHooksOfFiber(childFiber);
    expect(tree).toEqual([
      {
        name: 'Context',
        value: 'contextual',
        subHooks: [],
      },
    ]);
  });

  it('should inspect forwardRef', () => {
    let obj = function() {};
    let Foo = React.forwardRef(function(props, ref) {
      React.useImperativeHandle(ref, () => obj);
      return <div />;
    });
    let ref = React.createRef();
    let renderer = ReactTestRenderer.create(<Foo ref={ref} />);

    let childFiber = renderer.root.findByType(Foo)._currentFiber();
    let tree = ReactDebugTools.inspectHooksOfFiber(childFiber);
    expect(tree).toEqual([
      {name: 'ImperativeHandle', value: obj, subHooks: []},
    ]);
  });

  it('should inspect memo', () => {
    function InnerFoo(props) {
      let [value] = React.useState('hello');
      return <div>{value}</div>;
    }
    let Foo = React.memo(InnerFoo);
    let renderer = ReactTestRenderer.create(<Foo />);
    // TODO: Test renderer findByType is broken for memo. Have to search for the inner.
    let childFiber = renderer.root.findByType(InnerFoo)._currentFiber();
    let tree = ReactDebugTools.inspectHooksOfFiber(childFiber);
    expect(tree).toEqual([{name: 'State', value: 'hello', subHooks: []}]);
  });

  it('should inspect custom hooks', () => {
    function useCustom() {
      let [value] = React.useState('hello');
      return value;
    }
    function Foo(props) {
      let value = useCustom();
      return <div>{value}</div>;
    }
    let renderer = ReactTestRenderer.create(<Foo />);
    let childFiber = renderer.root.findByType(Foo)._currentFiber();
    let tree = ReactDebugTools.inspectHooksOfFiber(childFiber);
    expect(tree).toEqual([
      {
        name: 'Custom',
        value: undefined,
        subHooks: [{name: 'State', value: 'hello', subHooks: []}],
      },
    ]);
  });

  it('should support defaultProps and lazy', async () => {
    let Suspense = React.Suspense;

    function Foo(props) {
      let [value] = React.useState(props.defaultValue.substr(0, 3));
      return <div>{value}</div>;
    }
    Foo.defaultProps = {
      defaultValue: 'default',
    };

    async function fakeImport(result) {
      return {default: result};
    }

    let LazyFoo = React.lazy(() => fakeImport(Foo));

    let renderer = ReactTestRenderer.create(
      <Suspense fallback="Loading...">
        <LazyFoo />
      </Suspense>,
    );

    await LazyFoo;

    let childFiber = renderer.root._currentFiber();
    let tree = ReactDebugTools.inspectHooksOfFiber(childFiber);
    expect(tree).toEqual([{name: 'State', value: 'def', subHooks: []}]);
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

    let renderer = ReactTestRenderer.create(<Foo />);
    let childFiber = renderer.root._currentFiber();
    expect(() => {
      ReactDebugTools.inspectHooksOfFiber(childFiber, FakeDispatcherRef);
    }).toThrow(
      'Hooks can only be called inside the body of a function component.',
    );

    expect(getterCalls).toBe(1);
    expect(setterCalls).toHaveLength(2);
    expect(setterCalls[0]).not.toBe(initial);
    expect(setterCalls[1]).toBe(initial);
  });
});
