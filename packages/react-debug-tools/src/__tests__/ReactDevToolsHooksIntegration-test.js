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
  let act;
  let overrideHookState;
  let overrideProps;
  let suspendedFibers;

  beforeEach(() => {
    suspendedFibers = new Set();
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      inject: injected => {
        overrideHookState = injected.overrideHookState;
        overrideProps = injected.overrideProps;
      },
      supportsFiber: true,
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
      shouldSuspendFiber(rendererId, fiber) {
        return (
          suspendedFibers.has(fiber) ||
          (fiber.alternate && suspendedFibers.has(fiber.alternate))
        );
      },
    };

    jest.resetModules();

    React = require('react');
    ReactDebugTools = require('react-debug-tools');
    ReactTestRenderer = require('react-test-renderer');

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

  it('should support triggering suspense in DEV', () => {
    function MyComponent() {
      return 'Done';
    }

    const renderer = ReactTestRenderer.create(
      <React.Suspense fallback={'Loading'}>
        <MyComponent />
      </React.Suspense>,
    );
    expect(renderer.toJSON()).toEqual('Done');

    const fiber = renderer.root._currentFiber().return;
    if (__DEV__) {
      // Mark as loading
      suspendedFibers.add(fiber);
      overrideProps(fiber, [], null); // Re-render
      expect(renderer.toJSON()).toEqual('Loading');

      overrideProps(fiber, [], null); // Re-render
      expect(renderer.toJSON()).toEqual('Loading');

      // Mark as done
      suspendedFibers.delete(fiber);
      overrideProps(fiber, [], null); // Re-render
      expect(renderer.toJSON()).toEqual('Done');

      overrideProps(fiber, [], null); // Re-render
      expect(renderer.toJSON()).toEqual('Done');

      // Mark as loading again
      suspendedFibers.add(fiber);
      overrideProps(fiber, [], null); // Re-render
      expect(renderer.toJSON()).toEqual('Loading');
    }
  });
});
