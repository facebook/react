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

describe('React hooks DevTools integration', () => {
  let React;
  let ReactDebugTools;
  let ReactTestRenderer;
  let Scheduler;
  let act;
  let overrideHookState;
  let scheduleUpdate;
  let setSuspenseHandler;

  beforeEach(() => {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      inject: injected => {
        overrideHookState = injected.overrideHookState;
        scheduleUpdate = injected.scheduleUpdate;
        setSuspenseHandler = injected.setSuspenseHandler;
      },
      supportsFiber: true,
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
    };

    jest.resetModules();

    React = require('react');
    ReactDebugTools = require('react-debug-tools');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');

    act = ReactTestRenderer.act;
  });

  it('should support editing useState hooks', () => {
    let setCountFn;

    function MyComponent() {
      const [count, setCount] = React.useState(0);
      setCountFn = setCount;
      return <div>count:{count}</div>;
    }

    const renderer = ReactTestRenderer.create(<MyComponent />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['count:', '0'],
    });

    const fiber = renderer.root.findByType(MyComponent)._currentFiber();
    const tree = ReactDebugTools.inspectHooksOfFiber(fiber);
    const stateHook = tree[0];
    expect(stateHook.isStateEditable).toBe(true);

    if (__DEV__) {
      overrideHookState(fiber, stateHook.id, [], 10);
      expect(renderer.toJSON()).toEqual({
        type: 'div',
        props: {},
        children: ['count:', '10'],
      });

      act(() => setCountFn(count => count + 1));
      expect(renderer.toJSON()).toEqual({
        type: 'div',
        props: {},
        children: ['count:', '11'],
      });
    }
  });

  it('should support editable useReducer hooks', () => {
    const initialData = {foo: 'abc', bar: 123};

    function reducer(state, action) {
      switch (action.type) {
        case 'swap':
          return {foo: state.bar, bar: state.foo};
        default:
          throw new Error();
      }
    }

    let dispatchFn;
    function MyComponent() {
      const [state, dispatch] = React.useReducer(reducer, initialData);
      dispatchFn = dispatch;
      return (
        <div>
          foo:{state.foo}, bar:{state.bar}
        </div>
      );
    }

    const renderer = ReactTestRenderer.create(<MyComponent />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['foo:', 'abc', ', bar:', '123'],
    });

    const fiber = renderer.root.findByType(MyComponent)._currentFiber();
    const tree = ReactDebugTools.inspectHooksOfFiber(fiber);
    const reducerHook = tree[0];
    expect(reducerHook.isStateEditable).toBe(true);

    if (__DEV__) {
      overrideHookState(fiber, reducerHook.id, ['foo'], 'def');
      expect(renderer.toJSON()).toEqual({
        type: 'div',
        props: {},
        children: ['foo:', 'def', ', bar:', '123'],
      });

      act(() => dispatchFn({type: 'swap'}));
      expect(renderer.toJSON()).toEqual({
        type: 'div',
        props: {},
        children: ['foo:', '123', ', bar:', 'def'],
      });
    }
  });

  // This test case is based on an open source bug report:
  // facebookincubator/redux-react-hook/issues/34#issuecomment-466693787
  it('should handle interleaved stateful hooks (e.g. useState) and non-stateful hooks (e.g. useContext)', () => {
    const MyContext = React.createContext(1);

    let setStateFn;
    function useCustomHook() {
      const context = React.useContext(MyContext);
      const [state, setState] = React.useState({count: context});
      React.useDebugValue(state.count);
      setStateFn = setState;
      return state.count;
    }

    function MyComponent() {
      const count = useCustomHook();
      return <div>count:{count}</div>;
    }

    const renderer = ReactTestRenderer.create(<MyComponent />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['count:', '1'],
    });

    const fiber = renderer.root.findByType(MyComponent)._currentFiber();
    const tree = ReactDebugTools.inspectHooksOfFiber(fiber);
    const stateHook = tree[0].subHooks[1];
    expect(stateHook.isStateEditable).toBe(true);

    if (__DEV__) {
      overrideHookState(fiber, stateHook.id, ['count'], 10);
      expect(renderer.toJSON()).toEqual({
        type: 'div',
        props: {},
        children: ['count:', '10'],
      });

      act(() => setStateFn(state => ({count: state.count + 1})));
      expect(renderer.toJSON()).toEqual({
        type: 'div',
        props: {},
        children: ['count:', '11'],
      });
    }
  });

  it('should support overriding suspense in sync mode', () => {
    if (__DEV__) {
      // Lock the first render
      setSuspenseHandler(() => true);
    }

    function MyComponent() {
      return 'Done';
    }

    const renderer = ReactTestRenderer.create(
      <div>
        <React.Suspense fallback={'Loading'}>
          <MyComponent />
        </React.Suspense>
      </div>,
    );
    const fiber = renderer.root._currentFiber().child;
    if (__DEV__) {
      // First render was locked
      expect(renderer.toJSON().children).toEqual(['Loading']);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Loading']);

      // Release the lock
      setSuspenseHandler(() => false);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);

      // Lock again
      setSuspenseHandler(() => true);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Loading']);

      // Release the lock again
      setSuspenseHandler(() => false);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);

      // Ensure it checks specific fibers.
      setSuspenseHandler(f => f === fiber || f === fiber.alternate);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Loading']);
      setSuspenseHandler(f => f !== fiber && f !== fiber.alternate);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);
    } else {
      expect(renderer.toJSON().children).toEqual(['Done']);
    }
  });

  it('should support overriding suspense in concurrent mode', () => {
    if (__DEV__) {
      // Lock the first render
      setSuspenseHandler(() => true);
    }

    function MyComponent() {
      return 'Done';
    }

    const renderer = ReactTestRenderer.create(
      <div>
        <React.Suspense fallback={'Loading'}>
          <MyComponent />
        </React.Suspense>
      </div>,
      {unstable_isConcurrent: true},
    );

    expect(Scheduler).toFlushAndYield([]);
    // Ensure we timeout any suspense time.
    jest.advanceTimersByTime(1000);
    const fiber = renderer.root._currentFiber().child;
    if (__DEV__) {
      // First render was locked
      expect(renderer.toJSON().children).toEqual(['Loading']);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Loading']);

      // Release the lock
      setSuspenseHandler(() => false);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);

      // Lock again
      setSuspenseHandler(() => true);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Loading']);

      // Release the lock again
      setSuspenseHandler(() => false);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);

      // Ensure it checks specific fibers.
      setSuspenseHandler(f => f === fiber || f === fiber.alternate);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Loading']);
      setSuspenseHandler(f => f !== fiber && f !== fiber.alternate);
      scheduleUpdate(fiber); // Re-render
      expect(renderer.toJSON().children).toEqual(['Done']);
    } else {
      expect(renderer.toJSON().children).toEqual(['Done']);
    }
  });
});
