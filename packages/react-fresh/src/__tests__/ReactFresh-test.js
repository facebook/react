/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

let React;
let ReactDOM;
let ReactFreshRuntime;
let Scheduler;
let act;

describe('ReactFresh', () => {
  let container;
  let lastRoot;
  let findHostNodesForHotUpdate;
  let scheduleHotUpdate;

  beforeEach(() => {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: injected => {
        scheduleHotUpdate = injected.scheduleHotUpdate;
        findHostNodesForHotUpdate = injected.findHostNodesForHotUpdate;
      },
      onCommitFiberRoot: (id, root) => {
        lastRoot = root;
      },
      onCommitFiberUnmount: () => {},
    };

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactFreshRuntime = require('react-fresh/runtime');
    Scheduler = require('scheduler');
    act = require('react-dom/test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function prepare(version) {
    const Component = version();
    return Component;
  }

  function render(version, props) {
    const Component = version();
    act(() => {
      ReactDOM.render(<Component {...props} />, container);
    });
    return Component;
  }

  function patch(version) {
    const Component = version();
    const hotUpdate = ReactFreshRuntime.prepareUpdate();
    scheduleHotUpdate(lastRoot, hotUpdate);
    return Component;
  }

  function __register__(type, id) {
    ReactFreshRuntime.register(type, id);
  }

  function __signature__(type, key, forceReset, getCustomHooks) {
    ReactFreshRuntime.setSignature(type, key, forceReset, getCustomHooks);
    return type;
  }

  it('can preserve state for compatible types', () => {
    if (__DEV__) {
      let HelloV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let HelloV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Bump the state again.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Perform top-down renders with both fresh and stale types.
      // Neither should change the state or color.
      // They should always resolve to the latest version.
      render(() => HelloV1);
      render(() => HelloV2);
      render(() => HelloV1);
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Bump the state again.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('3');
      expect(el.style.color).toBe('red');

      // Finally, a render with incompatible type should reset it.
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        // No register call.
        // This is considered a new type.
        return Hello;
      });
      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('blue');
    }
  });

  it('can preserve state for forwardRef', () => {
    if (__DEV__) {
      let OuterV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.forwardRef(() => <Hello />);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let OuterV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.forwardRef(() => <Hello />);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Bump the state again.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Perform top-down renders with both fresh and stale types.
      // Neither should change the state or color.
      // They should always resolve to the latest version.
      render(() => OuterV1);
      render(() => OuterV2);
      render(() => OuterV1);
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Finally, a render with incompatible type should reset it.
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        // Note: no forwardRef wrapper this time.
        return Hello;
      });

      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('blue');
    }
  });

  it('should not consider two forwardRefs around the same type to be equivalent', () => {
    if (__DEV__) {
      let ParentV1 = render(
        () => {
          function Hello() {
            const [val, setVal] = React.useState(0);
            return (
              <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
                {val}
              </p>
            );
          }
          __register__(Hello, 'Hello');

          function renderInner() {
            return <Hello />;
          }
          // Both of these are wrappers around the same inner function.
          // They should be treated as distinct types across reloads.
          let ForwardRefA = React.forwardRef(renderInner);
          __register__(ForwardRefA, 'ForwardRefA');
          let ForwardRefB = React.forwardRef(renderInner);
          __register__(ForwardRefB, 'ForwardRefB');

          function Parent({cond}) {
            return cond ? <ForwardRefA /> : <ForwardRefB />;
          }
          __register__(Parent, 'Parent');

          return Parent;
        },
        {cond: true},
      );

      // Bump the state before switching up types.
      let el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Switching up the inner types should reset the state.
      render(() => ParentV1, {cond: false});
      expect(el).not.toBe(container.firstChild);
      el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');

      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Switch them up back again.
      render(() => ParentV1, {cond: true});
      expect(el).not.toBe(container.firstChild);
      el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');

      // Now bump up the state to prepare for patching.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Patch to change the color.
      let ParentV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        function renderInner() {
          return <Hello />;
        }
        // Both of these are wrappers around the same inner function.
        // They should be treated as distinct types across reloads.
        let ForwardRefA = React.forwardRef(renderInner);
        __register__(ForwardRefA, 'ForwardRefA');
        let ForwardRefB = React.forwardRef(renderInner);
        __register__(ForwardRefB, 'ForwardRefB');

        function Parent({cond}) {
          return cond ? <ForwardRefA /> : <ForwardRefB />;
        }
        __register__(Parent, 'Parent');

        return Parent;
      });

      // The state should be intact; the color should change.
      expect(el).toBe(container.firstChild);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Switching up the condition should still reset the state.
      render(() => ParentV2, {cond: false});
      expect(el).not.toBe(container.firstChild);
      el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('red');

      // Now bump up the state to prepare for top-level renders.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el).toBe(container.firstChild);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Finally, verify using top-level render with stale type keeps state.
      render(() => ParentV1);
      render(() => ParentV2);
      render(() => ParentV1);
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');
    }
  });

  it('can update forwardRef render function with its wrapper', () => {
    if (__DEV__) {
      render(() => {
        function Hello({color}) {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.forwardRef(() => <Hello color="blue" />);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      patch(() => {
        function Hello({color}) {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.forwardRef(() => <Hello color="red" />);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');
    }
  });

  it('can update forwardRef render function in isolation', () => {
    if (__DEV__) {
      render(() => {
        function Hello({color}) {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        function renderHello() {
          return <Hello color="blue" />;
        }
        __register__(renderHello, 'renderHello');

        return React.forwardRef(renderHello);
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update of just the rendering function.
      patch(() => {
        function Hello({color}) {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        function renderHello() {
          return <Hello color="red" />;
        }
        __register__(renderHello, 'renderHello');

        // Not updating the wrapper.
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');
    }
  });

  it('can preserve state for simple memo', () => {
    if (__DEV__) {
      let OuterV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.memo(Hello);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let OuterV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.memo(Hello);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Bump the state again.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Perform top-down renders with both fresh and stale types.
      // Neither should change the state or color.
      // They should always resolve to the latest version.
      render(() => OuterV1);
      render(() => OuterV2);
      render(() => OuterV1);
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Finally, a render with incompatible type should reset it.
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        // Note: no wrapper this time.
        return Hello;
      });

      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('blue');
    }
  });

  it('can preserve state for memo with custom comparison', () => {
    if (__DEV__) {
      let OuterV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }

        const Outer = React.memo(Hello, () => true);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let OuterV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }

        const Outer = React.memo(Hello, () => true);
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Bump the state again.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Perform top-down renders with both fresh and stale types.
      // Neither should change the state or color.
      // They should always resolve to the latest version.
      render(() => OuterV1);
      render(() => OuterV2);
      render(() => OuterV1);
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Finally, a render with incompatible type should reset it.
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        // Note: no wrapper this time.
        return Hello;
      });

      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('blue');
    }
  });

  it('can update simple memo function in isolation', () => {
    if (__DEV__) {
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        return React.memo(Hello);
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update of just the rendering function.
      patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        // Not updating the wrapper.
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');
    }
  });

  it('can preserve state for memo(forwardRef)', () => {
    if (__DEV__) {
      let OuterV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.memo(React.forwardRef(() => <Hello />));
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let OuterV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.memo(React.forwardRef(() => <Hello />));
        __register__(Outer, 'Outer');
        return Outer;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Bump the state again.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Perform top-down renders with both fresh and stale types.
      // Neither should change the state or color.
      // They should always resolve to the latest version.
      render(() => OuterV1);
      render(() => OuterV2);
      render(() => OuterV1);
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Finally, a render with incompatible type should reset it.
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        // Note: no wrapper this time.
        return Hello;
      });

      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('blue');
    }
  });

  it('can preserve state for lazy after resolution', async () => {
    if (__DEV__) {
      let AppV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.lazy(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve({default: Hello}), 100);
            }),
        );
        __register__(Outer, 'Outer');

        function App() {
          return (
            <React.Suspense fallback={<p>Loading</p>}>
              <Outer />
            </React.Suspense>
          );
        }
        __register__(App, 'App');

        return App;
      });

      expect(container.textContent).toBe('Loading');
      await act(async () => {
        jest.runAllTimers();
      });
      expect(container.textContent).toBe('0');

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let AppV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.lazy(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve({default: Hello}), 100);
            }),
        );
        __register__(Outer, 'Outer');

        function App() {
          return (
            <React.Suspense fallback={<p>Loading</p>}>
              <Outer />
            </React.Suspense>
          );
        }
        __register__(App, 'App');

        return App;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Bump the state again.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Perform top-down renders with both fresh and stale types.
      // Neither should change the state or color.
      // They should always resolve to the latest version.
      render(() => AppV1);
      render(() => AppV2);
      render(() => AppV1);
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('2');
      expect(el.style.color).toBe('red');

      // Finally, a render with incompatible type should reset it.
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        // Note: no lazy wrapper this time.

        function App() {
          return (
            <React.Suspense fallback={<p>Loading</p>}>
              <Hello />
            </React.Suspense>
          );
        }
        __register__(App, 'App');

        return App;
      });

      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('blue');
    }
  });

  it('can patch lazy before resolution', async () => {
    if (__DEV__) {
      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        const Outer = React.lazy(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve({default: Hello}), 100);
            }),
        );
        __register__(Outer, 'Outer');

        function App() {
          return (
            <React.Suspense fallback={<p>Loading</p>}>
              <Outer />
            </React.Suspense>
          );
        }

        return App;
      });

      expect(container.textContent).toBe('Loading');

      // Perform a hot update.
      patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });

      await act(async () => {
        jest.runAllTimers();
      });

      // Expect different color on initial mount.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('red');

      // Bump state.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Test another reload.
      patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('orange');
    }
  });

  it('can patch lazy(forwardRef) before resolution', async () => {
    if (__DEV__) {
      render(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.forwardRef(renderHello);
        __register__(Hello, 'Hello');

        const Outer = React.lazy(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve({default: Hello}), 100);
            }),
        );
        __register__(Outer, 'Outer');

        function App() {
          return (
            <React.Suspense fallback={<p>Loading</p>}>
              <Outer />
            </React.Suspense>
          );
        }

        return App;
      });

      expect(container.textContent).toBe('Loading');

      // Perform a hot update.
      patch(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.forwardRef(renderHello);
        __register__(Hello, 'Hello');
      });

      await act(async () => {
        jest.runAllTimers();
      });

      // Expect different color on initial mount.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('red');

      // Bump state.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Test another reload.
      patch(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.forwardRef(renderHello);
        __register__(Hello, 'Hello');
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('orange');
    }
  });

  it('can patch lazy(memo) before resolution', async () => {
    if (__DEV__) {
      render(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.memo(renderHello);
        __register__(Hello, 'Hello');

        const Outer = React.lazy(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve({default: Hello}), 100);
            }),
        );
        __register__(Outer, 'Outer');

        function App() {
          return (
            <React.Suspense fallback={<p>Loading</p>}>
              <Outer />
            </React.Suspense>
          );
        }

        return App;
      });

      expect(container.textContent).toBe('Loading');

      // Perform a hot update.
      patch(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.memo(renderHello);
        __register__(Hello, 'Hello');
      });

      await act(async () => {
        jest.runAllTimers();
      });

      // Expect different color on initial mount.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('red');

      // Bump state.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Test another reload.
      patch(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.memo(renderHello);
        __register__(Hello, 'Hello');
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('orange');
    }
  });

  it('can patch lazy(memo(forwardRef)) before resolution', async () => {
    if (__DEV__) {
      render(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.memo(React.forwardRef(renderHello));
        __register__(Hello, 'Hello');

        const Outer = React.lazy(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve({default: Hello}), 100);
            }),
        );
        __register__(Outer, 'Outer');

        function App() {
          return (
            <React.Suspense fallback={<p>Loading</p>}>
              <Outer />
            </React.Suspense>
          );
        }

        return App;
      });

      expect(container.textContent).toBe('Loading');

      // Perform a hot update.
      patch(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.memo(React.forwardRef(renderHello));
        __register__(Hello, 'Hello');
      });

      await act(async () => {
        jest.runAllTimers();
      });

      // Expect different color on initial mount.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('red');

      // Bump state.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Test another reload.
      patch(() => {
        function renderHello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        const Hello = React.memo(React.forwardRef(renderHello));
        __register__(Hello, 'Hello');
      });
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('orange');
    }
  });

  it('can patch both trees while suspense is displaying the fallback', async () => {
    if (__DEV__) {
      const AppV1 = render(
        () => {
          function Hello({children}) {
            const [val, setVal] = React.useState(0);
            return (
              <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
                {children} {val}
              </p>
            );
          }
          __register__(Hello, 'Hello');

          function Never() {
            throw new Promise(resolve => {});
          }

          function App({shouldSuspend}) {
            return (
              <React.Suspense fallback={<Hello>Fallback</Hello>}>
                <Hello>Content</Hello>
                {shouldSuspend && <Never />}
              </React.Suspense>
            );
          }

          return App;
        },
        {shouldSuspend: false},
      );

      // We start with just the primary tree.
      expect(container.childNodes.length).toBe(1);
      const primaryChild = container.firstChild;
      expect(primaryChild.textContent).toBe('Content 0');
      expect(primaryChild.style.color).toBe('blue');
      expect(primaryChild.style.display).toBe('');

      // Bump primary content state.
      act(() => {
        primaryChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.childNodes.length).toBe(1);
      expect(container.childNodes[0]).toBe(primaryChild);
      expect(primaryChild.textContent).toBe('Content 1');
      expect(primaryChild.style.color).toBe('blue');
      expect(primaryChild.style.display).toBe('');

      // Perform a hot update.
      patch(() => {
        function Hello({children}) {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'green'}} onClick={() => setVal(val + 1)}>
              {children} {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });
      expect(container.childNodes.length).toBe(1);
      expect(container.childNodes[0]).toBe(primaryChild);
      expect(primaryChild.textContent).toBe('Content 1');
      expect(primaryChild.style.color).toBe('green');
      expect(primaryChild.style.display).toBe('');

      // Now force the tree to suspend.
      render(() => AppV1, {shouldSuspend: true});

      // Expect to see two trees, one of them is hidden.
      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0]).toBe(primaryChild);
      const fallbackChild = container.childNodes[1];
      expect(primaryChild.textContent).toBe('Content 1');
      expect(primaryChild.style.color).toBe('green');
      expect(primaryChild.style.display).toBe('none !important');
      expect(fallbackChild.textContent).toBe('Fallback 0');
      expect(fallbackChild.style.color).toBe('green');
      expect(fallbackChild.style.display).toBe('');

      // Bump fallback state.
      act(() => {
        fallbackChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0]).toBe(primaryChild);
      expect(container.childNodes[1]).toBe(fallbackChild);
      expect(primaryChild.textContent).toBe('Content 1');
      expect(primaryChild.style.color).toBe('green');
      expect(primaryChild.style.display).toBe('none !important');
      expect(fallbackChild.textContent).toBe('Fallback 1');
      expect(fallbackChild.style.color).toBe('green');
      expect(fallbackChild.style.display).toBe('');

      // Perform a hot update.
      patch(() => {
        function Hello({children}) {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {children} {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });

      // Colors inside both trees should change:
      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0]).toBe(primaryChild);
      expect(container.childNodes[1]).toBe(fallbackChild);
      expect(primaryChild.textContent).toBe('Content 1');
      expect(primaryChild.style.color).toBe('red');
      expect(primaryChild.style.display).toBe('none !important');
      expect(fallbackChild.textContent).toBe('Fallback 1');
      expect(fallbackChild.style.color).toBe('red');
      expect(fallbackChild.style.display).toBe('');

      // Only primary tree should exist now:
      render(() => AppV1, {shouldSuspend: false});
      expect(container.childNodes.length).toBe(1);
      expect(container.childNodes[0]).toBe(primaryChild);
      expect(primaryChild.textContent).toBe('Content 1');
      expect(primaryChild.style.color).toBe('red');
      expect(primaryChild.style.display).toBe('');

      // Perform a hot update.
      patch(() => {
        function Hello({children}) {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {children} {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });
      expect(container.childNodes.length).toBe(1);
      expect(container.childNodes[0]).toBe(primaryChild);
      expect(primaryChild.textContent).toBe('Content 1');
      expect(primaryChild.style.color).toBe('orange');
      expect(primaryChild.style.display).toBe('');
    }
  });

  it('does not re-render ancestor components unnecessarily during a hot update', () => {
    if (__DEV__) {
      let appRenders = 0;

      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        function App() {
          appRenders++;
          return <Hello />;
        }
        __register__(App, 'App');
        return App;
      });

      expect(appRenders).toBe(1);

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // No re-renders from the top.
      expect(appRenders).toBe(1);

      // Perform a hot update for Hello only.
      patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Still no re-renders from the top.
      expect(appRenders).toBe(1);

      // Bump the state.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('2');

      // Still no re-renders from the top.
      expect(appRenders).toBe(1);
    }
  });

  it('batches re-renders during a hot update', () => {
    if (__DEV__) {
      let helloRenders = 0;

      render(() => {
        function Hello({children}) {
          helloRenders++;
          return <div>X{children}X</div>;
        }
        __register__(Hello, 'Hello');

        function App() {
          return (
            <Hello>
              <Hello>
                <Hello />
              </Hello>
              <Hello>
                <Hello />
              </Hello>
            </Hello>
          );
        }
        return App;
      });
      expect(helloRenders).toBe(5);
      expect(container.textContent).toBe('XXXXXXXXXX');
      helloRenders = 0;

      patch(() => {
        function Hello({children}) {
          helloRenders++;
          return <div>O{children}O</div>;
        }
        __register__(Hello, 'Hello');
      });
      expect(helloRenders).toBe(5);
      expect(container.textContent).toBe('OOOOOOOOOO');
    }
  });

  it('does not leak state between components', () => {
    if (__DEV__) {
      const AppV1 = render(
        () => {
          function Hello1() {
            const [val, setVal] = React.useState(0);
            return (
              <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
                {val}
              </p>
            );
          }
          __register__(Hello1, 'Hello1');
          function Hello2() {
            const [val, setVal] = React.useState(0);
            return (
              <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
                {val}
              </p>
            );
          }
          __register__(Hello2, 'Hello2');
          function App({cond}) {
            return cond ? <Hello1 /> : <Hello2 />;
          }
          __register__(App, 'App');
          return App;
        },
        {cond: false},
      );

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Switch the condition, flipping inner content.
      // This should reset the state.
      render(() => AppV1, {cond: true});
      const el2 = container.firstChild;
      expect(el2).not.toBe(el);
      expect(el2.textContent).toBe('0');
      expect(el2.style.color).toBe('blue');

      // Bump it again.
      act(() => {
        el2.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el2.textContent).toBe('1');

      // Perform a hot update for both inner components.
      patch(() => {
        function Hello1() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello1, 'Hello1');
        function Hello2() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello2, 'Hello2');
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el2);
      expect(el2.textContent).toBe('1');
      expect(el2.style.color).toBe('red');

      // Flip the condition again.
      render(() => AppV1, {cond: false});
      const el3 = container.firstChild;
      expect(el3).not.toBe(el2);
      expect(el3.textContent).toBe('0');
      expect(el3.style.color).toBe('red');
    }
  });

  it('can force remount by changing signature', () => {
    if (__DEV__) {
      let HelloV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        // When this changes, we'll expect a remount:
        __signature__(Hello, '1');
        return Hello;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let HelloV2 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        // The signature hasn't changed since the last time:
        __signature__(Hello, '1');
        return Hello;
      });

      // Assert the state was preserved but color changed.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('1');
      expect(el.style.color).toBe('red');

      // Perform a hot update.
      let HelloV3 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'yellow'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        // We're changing the signature now so it will remount:
        __register__(Hello, 'Hello');
        __signature__(Hello, '2');
        return Hello;
      });

      // Expect a remount.
      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('yellow');

      // Bump state again.
      act(() => {
        newEl.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(newEl.textContent).toBe('1');
      expect(newEl.style.color).toBe('yellow');

      // Perform top-down renders with both fresh and stale types.
      // Neither should change the state or color.
      // They should always resolve to the latest version.
      render(() => HelloV1);
      render(() => HelloV2);
      render(() => HelloV3);
      render(() => HelloV2);
      render(() => HelloV1);
      expect(container.firstChild).toBe(newEl);
      expect(newEl.textContent).toBe('1');
      expect(newEl.style.color).toBe('yellow');

      // Verify we can patch again while preserving the signature.
      patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'purple'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        // Same signature as last time.
        __register__(Hello, 'Hello');
        __signature__(Hello, '2');
        return Hello;
      });

      expect(container.firstChild).toBe(newEl);
      expect(newEl.textContent).toBe('1');
      expect(newEl.style.color).toBe('purple');

      // Check removing the signature also causes a remount.
      patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        // No signature this time.
        __register__(Hello, 'Hello');
        return Hello;
      });

      // Expect a remount.
      expect(container.firstChild).not.toBe(newEl);
      const finalEl = container.firstChild;
      expect(finalEl.textContent).toBe('0');
      expect(finalEl.style.color).toBe('orange');
    }
  });

  it('keeps a valid tree when forcing remount', () => {
    if (__DEV__) {
      let HelloV1 = prepare(() => {
        function Hello() {
          return null;
        }
        __register__(Hello, 'Hello');
        __signature__(Hello, '1');
        return Hello;
      });

      const Bailout = React.memo(({children}) => {
        return children;
      });

      // Each of those renders three instances of HelloV1,
      // but in different ways.
      let trees = [
        <div>
          <HelloV1 />
          <div>
            <HelloV1 />
            <Bailout>
              <HelloV1 />
            </Bailout>
          </div>
        </div>,
        <div>
          <div>
            <HelloV1>
              <HelloV1 />
            </HelloV1>
            <HelloV1 />
          </div>
        </div>,
        <div>
          <span />
          <HelloV1 />
          <HelloV1 />
          <HelloV1 />
        </div>,
        <div>
          <HelloV1 />
          <span />
          <HelloV1 />
          <HelloV1 />
        </div>,
        <div>
          <div>foo</div>
          <HelloV1 />
          <div>
            <HelloV1 />
          </div>
          <HelloV1 />
          <span />
        </div>,
        <div>
          <HelloV1>
            <span />
            Hello
            <span />
          </HelloV1>,
          <HelloV1>
            <React.Fragment>
              <HelloV1 />
            </React.Fragment>
          </HelloV1>,
        </div>,
        <HelloV1>
          <HelloV1>
            <Bailout>
              <span />
              <HelloV1>
                <span />
              </HelloV1>
              <span />
            </Bailout>
          </HelloV1>
        </HelloV1>,
        <div>
          <span />
          <HelloV1 key="0" />
          <HelloV1 key="1" />
          <HelloV1 key="2" />
          <span />
        </div>,
        <div>
          <span />
          {null}
          <HelloV1 key="1" />
          {null}
          <HelloV1 />
          <HelloV1 />
          <span />
        </div>,
        <div>
          <HelloV1 key="2" />
          <span />
          <HelloV1 key="0" />
          <span />
          <HelloV1 key="1" />
        </div>,
        <div>
          {[[<HelloV1 key="2" />]]}
          <span>
            <HelloV1 key="0" />
            {[null]}
            <HelloV1 key="1" />
          </span>
        </div>,
        <div>
          {['foo', <HelloV1 key="hi" />, null, <HelloV1 key="2" />]}
          <span>
            {[null]}
            <HelloV1 key="x" />
          </span>
        </div>,
        <HelloV1>
          <HelloV1>
            <span />
            <Bailout>
              <HelloV1>hi</HelloV1>
              <span />
            </Bailout>
          </HelloV1>
        </HelloV1>,
      ];

      // First, check that each tree handles remounts in isolation.
      ReactDOM.render(null, container);
      for (let i = 0; i < trees.length; i++) {
        runRemountingStressTest(trees[i]);
      }

      // Then check that each tree is resilient to updates from another tree.
      for (let i = 0; i < trees.length; i++) {
        for (let j = 0; j < trees.length; j++) {
          ReactDOM.render(null, container);
          // Intentionally don't clean up between the tests:
          runRemountingStressTest(trees[i]);
          runRemountingStressTest(trees[j]);
          runRemountingStressTest(trees[i]);
        }
      }
    }
  });

  function runRemountingStressTest(tree) {
    patch(() => {
      function Hello({children}) {
        return <section data-color="blue">{children}</section>;
      }
      __register__(Hello, 'Hello');
      __signature__(Hello, '1');
      return Hello;
    });

    ReactDOM.render(tree, container);
    const elements = container.querySelectorAll('section');
    // Each tree above products exactly three <section> elements:
    expect(elements.length).toBe(3);
    elements.forEach(el => {
      expect(el.dataset.color).toBe('blue');
    });

    // Patch color without changing the signature.
    patch(() => {
      function Hello({children}) {
        return <section data-color="red">{children}</section>;
      }
      __register__(Hello, 'Hello');
      __signature__(Hello, '1');
      return Hello;
    });

    const elementsAfterPatch = container.querySelectorAll('section');
    expect(elementsAfterPatch.length).toBe(3);
    elementsAfterPatch.forEach((el, index) => {
      // The signature hasn't changed so we expect DOM nodes to stay the same.
      expect(el).toBe(elements[index]);
      // However, the color should have changed:
      expect(el.dataset.color).toBe('red');
    });

    // Patch color *and* change the signature.
    patch(() => {
      function Hello({children}) {
        return <section data-color="orange">{children}</section>;
      }
      __register__(Hello, 'Hello');
      __signature__(Hello, '2'); // Remount
      return Hello;
    });

    const elementsAfterRemount = container.querySelectorAll('section');
    expect(elementsAfterRemount.length).toBe(3);
    elementsAfterRemount.forEach((el, index) => {
      // The signature changed so we expect DOM nodes to be different.
      expect(el).not.toBe(elements[index]);
      // They should all be using the new color:
      expect(el.dataset.color).toBe('orange');
    });

    // Now patch color but *don't* change the signature.
    patch(() => {
      function Hello({children}) {
        return <section data-color="black">{children}</section>;
      }
      __register__(Hello, 'Hello');
      __signature__(Hello, '2'); // Same signature as before
      return Hello;
    });

    expect(container.querySelectorAll('section').length).toBe(3);
    container.querySelectorAll('section').forEach((el, index) => {
      // The signature didn't change so DOM nodes should stay the same.
      expect(el).toBe(elementsAfterRemount[index]);
      // They should all be using the new color:
      expect(el.dataset.color).toBe('black');
    });

    // Do another render just in case.
    ReactDOM.render(tree, container);
    expect(container.querySelectorAll('section').length).toBe(3);
    container.querySelectorAll('section').forEach((el, index) => {
      expect(el).toBe(elementsAfterRemount[index]);
      expect(el.dataset.color).toBe('black');
    });
  }

  it('can remount on signature change within a <root> wrapper', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => Hello);
    }
  });

  it('can remount on signature change within a simple memo wrapper', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => React.memo(Hello));
    }
  });

  it('can remount on signature change within a lazy simple memo wrapper', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello =>
        React.lazy(() => ({
          then(cb) {
            cb({default: React.memo(Hello)});
          },
        })),
      );
    }
  });

  it('can remount on signature change within forwardRef', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => React.forwardRef(Hello));
    }
  });

  it('can remount on signature change within forwardRef render function', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => React.forwardRef(() => <Hello />));
    }
  });

  it('can remount on signature change within nested memo', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello =>
        React.memo(React.memo(React.memo(Hello))),
      );
    }
  });

  it('can remount on signature change within a memo wrapper and custom comparison', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => React.memo(Hello, () => true));
    }
  });

  it('can remount on signature change within a class', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        const child = <Hello />;
        return class Wrapper extends React.PureComponent {
          render() {
            return child;
          }
        };
      });
    }
  });

  it('can remount on signature change within a context provider', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        const Context = React.createContext();
        const child = (
          <Context.Provider value="constant">
            <Hello />
          </Context.Provider>
        );
        return function Wrapper() {
          return child;
        };
      });
    }
  });

  it('can remount on signature change within a context consumer', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        const Context = React.createContext();
        const child = <Context.Consumer>{() => <Hello />}</Context.Consumer>;
        return function Wrapper() {
          return child;
        };
      });
    }
  });

  it('can remount on signature change within a suspense node', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        // TODO: we'll probably want to test fallback trees too.
        const child = (
          <React.Suspense>
            <Hello />
          </React.Suspense>
        );
        return function Wrapper() {
          return child;
        };
      });
    }
  });

  it('can remount on signature change within a mode node', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        const child = (
          <React.StrictMode>
            <Hello />
          </React.StrictMode>
        );
        return function Wrapper() {
          return child;
        };
      });
    }
  });

  it('can remount on signature change within a fragment node', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        const child = (
          <React.Fragment>
            <Hello />
          </React.Fragment>
        );
        return function Wrapper() {
          return child;
        };
      });
    }
  });

  it('can remount on signature change within multiple siblings', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        const child = (
          <React.Fragment>
            <React.Fragment>
              <React.Fragment />
            </React.Fragment>
            <Hello />
            <React.Fragment />
          </React.Fragment>
        );
        return function Wrapper() {
          return child;
        };
      });
    }
  });

  it('can remount on signature change within a profiler node', () => {
    if (__DEV__) {
      testRemountingWithWrapper(Hello => {
        const child = <Hello />;
        return function Wrapper() {
          return (
            <React.Profiler onRender={() => {}} id="foo">
              {child}
            </React.Profiler>
          );
        };
      });
    }
  });

  function testRemountingWithWrapper(wrap) {
    render(() => {
      function Hello() {
        const [val, setVal] = React.useState(0);
        return (
          <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
            {val}
          </p>
        );
      }
      __register__(Hello, 'Hello');
      // When this changes, we'll expect a remount:
      __signature__(Hello, '1');

      // Use the passed wrapper.
      // This will be different in every test.
      return wrap(Hello);
    });

    // Bump the state before patching.
    const el = container.firstChild;
    expect(el.textContent).toBe('0');
    expect(el.style.color).toBe('blue');
    act(() => {
      el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    });
    expect(el.textContent).toBe('1');

    // Perform a hot update that doesn't remount.
    patch(() => {
      function Hello() {
        const [val, setVal] = React.useState(0);
        return (
          <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
            {val}
          </p>
        );
      }
      __register__(Hello, 'Hello');
      // The signature hasn't changed since the last time:
      __signature__(Hello, '1');
      return Hello;
    });

    // Assert the state was preserved but color changed.
    expect(container.firstChild).toBe(el);
    expect(el.textContent).toBe('1');
    expect(el.style.color).toBe('red');

    // Perform a hot update that remounts.
    patch(() => {
      function Hello() {
        const [val, setVal] = React.useState(0);
        return (
          <p style={{color: 'yellow'}} onClick={() => setVal(val + 1)}>
            {val}
          </p>
        );
      }
      // We're changing the signature now so it will remount:
      __register__(Hello, 'Hello');
      __signature__(Hello, '2');
      return Hello;
    });

    // Expect a remount.
    expect(container.firstChild).not.toBe(el);
    const newEl = container.firstChild;
    expect(newEl.textContent).toBe('0');
    expect(newEl.style.color).toBe('yellow');

    // Bump state again.
    act(() => {
      newEl.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    });
    expect(newEl.textContent).toBe('1');
    expect(newEl.style.color).toBe('yellow');

    // Verify we can patch again while preserving the signature.
    patch(() => {
      function Hello() {
        const [val, setVal] = React.useState(0);
        return (
          <p style={{color: 'purple'}} onClick={() => setVal(val + 1)}>
            {val}
          </p>
        );
      }
      // Same signature as last time.
      __register__(Hello, 'Hello');
      __signature__(Hello, '2');
      return Hello;
    });

    expect(container.firstChild).toBe(newEl);
    expect(newEl.textContent).toBe('1');
    expect(newEl.style.color).toBe('purple');

    // Check removing the signature also causes a remount.
    patch(() => {
      function Hello() {
        const [val, setVal] = React.useState(0);
        return (
          <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
            {val}
          </p>
        );
      }
      // No signature this time.
      __register__(Hello, 'Hello');
      return Hello;
    });

    // Expect a remount.
    expect(container.firstChild).not.toBe(newEl);
    const finalEl = container.firstChild;
    expect(finalEl.textContent).toBe('0');
    expect(finalEl.style.color).toBe('orange');
  }

  it('resets hooks with dependencies on hot reload', () => {
    if (__DEV__) {
      let useEffectWithEmptyArrayCalls = 0;

      render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          const tranformed = React.useMemo(() => val * 2, [val]);
          const handleClick = React.useCallback(() => setVal(v => v + 1), []);

          React.useEffect(() => {
            useEffectWithEmptyArrayCalls++;
          }, []);

          return (
            <p style={{color: 'blue'}} onClick={handleClick}>
              {tranformed}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      expect(useEffectWithEmptyArrayCalls).toBe(1); // useEffect ran
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('2'); // val * 2
      expect(useEffectWithEmptyArrayCalls).toBe(1); // useEffect didn't re-run

      // Perform a hot update.
      act(() => {
        patch(() => {
          function Hello() {
            const [val, setVal] = React.useState(0);
            const tranformed = React.useMemo(() => val * 10, [val]);
            const handleClick = React.useCallback(() => setVal(v => v - 1), []);

            React.useEffect(() => {
              useEffectWithEmptyArrayCalls++;
            }, []);

            return (
              <p style={{color: 'red'}} onClick={handleClick}>
                {tranformed}
              </p>
            );
          }
          __register__(Hello, 'Hello');
          return Hello;
        });
      });

      // Assert the state was preserved but memo was evicted.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('10'); // val * 10
      expect(el.style.color).toBe('red');
      expect(useEffectWithEmptyArrayCalls).toBe(2); // useEffect re-ran

      // This should fire the new callback which decreases the counter.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('red');
      expect(useEffectWithEmptyArrayCalls).toBe(2); // useEffect didn't re-run
    }
  });

  it('can hot reload offscreen components', () => {
    if (__DEV__) {
      const AppV1 = prepare(() => {
        function Hello() {
          React.useLayoutEffect(() => {
            Scheduler.yieldValue('Hello#layout');
          });
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');

        return function App({offscreen}) {
          React.useLayoutEffect(() => {
            Scheduler.yieldValue('App#layout');
          });
          return (
            <div hidden={offscreen}>
              <Hello />
            </div>
          );
        };
      });

      const root = ReactDOM.unstable_createRoot(container);
      root.render(<AppV1 offscreen={true} />);
      expect(Scheduler).toFlushAndYieldThrough(['App#layout']);
      const el = container.firstChild;
      expect(el.hidden).toBe(true);
      expect(el.firstChild).toBe(null); // Offscreen content not flushed yet.

      // Perform a hot update.
      patch(() => {
        function Hello() {
          React.useLayoutEffect(() => {
            Scheduler.yieldValue('Hello#layout');
          });
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'red'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });

      // It's still offscreen so we don't see anything.
      expect(container.firstChild).toBe(el);
      expect(el.hidden).toBe(true);
      expect(el.firstChild).toBe(null);

      // Process the offscreen updates.
      expect(Scheduler).toFlushAndYieldThrough(['Hello#layout']);
      expect(container.firstChild).toBe(el);
      expect(el.firstChild.textContent).toBe('0');
      expect(el.firstChild.style.color).toBe('red');

      el.firstChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      expect(el.firstChild.textContent).toBe('0');
      expect(el.firstChild.style.color).toBe('red');
      expect(Scheduler).toFlushAndYieldThrough(['Hello#layout']);
      expect(el.firstChild.textContent).toBe('1');
      expect(el.firstChild.style.color).toBe('red');

      // Hot reload while we're offscreen.
      patch(() => {
        function Hello() {
          React.useLayoutEffect(() => {
            Scheduler.yieldValue('Hello#layout');
          });
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
      });

      // It's still offscreen so we don't see the updates.
      expect(container.firstChild).toBe(el);
      expect(el.firstChild.textContent).toBe('1');
      expect(el.firstChild.style.color).toBe('red');

      // Process the offscreen updates.
      expect(Scheduler).toFlushAndYieldThrough(['Hello#layout']);
      expect(container.firstChild).toBe(el);
      expect(el.firstChild.textContent).toBe('1');
      expect(el.firstChild.style.color).toBe('orange');
    }
  });

  it('remounts failed error boundaries (componentDidCatch)', () => {
    if (__DEV__) {
      render(() => {
        function Hello() {
          return <h1>Hi</h1>;
        }
        __register__(Hello, 'Hello');

        class Boundary extends React.Component {
          state = {error: null};
          componentDidCatch(error) {
            this.setState({error});
          }
          render() {
            if (this.state.error) {
              return <h1>Oops: {this.state.error.message}</h1>;
            }
            return this.props.children;
          }
        }

        function App() {
          return (
            <React.Fragment>
              <p>A</p>
              <Boundary>
                <Hello />
              </Boundary>
              <p>B</p>
            </React.Fragment>
          );
        }

        return App;
      });

      expect(container.innerHTML).toBe('<p>A</p><h1>Hi</h1><p>B</p>');
      const firstP = container.firstChild;
      const secondP = firstP.nextSibling.nextSibling;

      // Perform a hot update that fails.
      patch(() => {
        function Hello() {
          throw new Error('No');
        }
        __register__(Hello, 'Hello');
      });

      expect(container.innerHTML).toBe('<p>A</p><h1>Oops: No</h1><p>B</p>');
      expect(container.firstChild).toBe(firstP);
      expect(container.firstChild.nextSibling.nextSibling).toBe(secondP);

      // Perform a hot update that fixes the error.
      patch(() => {
        function Hello() {
          return <h1>Fixed!</h1>;
        }
        __register__(Hello, 'Hello');
      });

      // This should remount the error boundary (but not anything above it).
      expect(container.innerHTML).toBe('<p>A</p><h1>Fixed!</h1><p>B</p>');
      expect(container.firstChild).toBe(firstP);
      expect(container.firstChild.nextSibling.nextSibling).toBe(secondP);

      // Verify next hot reload doesn't remount anything.
      const helloNode = container.firstChild.nextSibling;
      patch(() => {
        function Hello() {
          return <h1>Nice.</h1>;
        }
        __register__(Hello, 'Hello');
      });
      expect(container.firstChild.nextSibling).toBe(helloNode);
      expect(helloNode.textContent).toBe('Nice.');
    }
  });

  it('remounts failed error boundaries (getDerivedStateFromError)', () => {
    if (__DEV__) {
      render(() => {
        function Hello() {
          return <h1>Hi</h1>;
        }
        __register__(Hello, 'Hello');

        class Boundary extends React.Component {
          state = {error: null};
          static getDerivedStateFromError(error) {
            return {error};
          }
          render() {
            if (this.state.error) {
              return <h1>Oops: {this.state.error.message}</h1>;
            }
            return this.props.children;
          }
        }

        function App() {
          return (
            <React.Fragment>
              <p>A</p>
              <Boundary>
                <Hello />
              </Boundary>
              <p>B</p>
            </React.Fragment>
          );
        }

        return App;
      });

      expect(container.innerHTML).toBe('<p>A</p><h1>Hi</h1><p>B</p>');
      const firstP = container.firstChild;
      const secondP = firstP.nextSibling.nextSibling;

      // Perform a hot update that fails.
      patch(() => {
        function Hello() {
          throw new Error('No');
        }
        __register__(Hello, 'Hello');
      });

      expect(container.innerHTML).toBe('<p>A</p><h1>Oops: No</h1><p>B</p>');
      expect(container.firstChild).toBe(firstP);
      expect(container.firstChild.nextSibling.nextSibling).toBe(secondP);

      // Perform a hot update that fixes the error.
      patch(() => {
        function Hello() {
          return <h1>Fixed!</h1>;
        }
        __register__(Hello, 'Hello');
      });

      // This should remount the error boundary (but not anything above it).
      expect(container.innerHTML).toBe('<p>A</p><h1>Fixed!</h1><p>B</p>');
      expect(container.firstChild).toBe(firstP);
      expect(container.firstChild.nextSibling.nextSibling).toBe(secondP);

      // Verify next hot reload doesn't remount anything.
      const helloNode = container.firstChild.nextSibling;
      patch(() => {
        function Hello() {
          return <h1>Nice.</h1>;
        }
        __register__(Hello, 'Hello');
      });
      expect(container.firstChild.nextSibling).toBe(helloNode);
      expect(helloNode.textContent).toBe('Nice.');
    }
  });

  it('remounts error boundaries that failed asynchronously after hot update', () => {
    if (__DEV__) {
      render(() => {
        function Hello() {
          const [x] = React.useState('');
          React.useEffect(() => {}, []);
          x.slice(); // Doesn't throw initially.
          return <h1>Hi</h1>;
        }
        __register__(Hello, 'Hello');

        class Boundary extends React.Component {
          state = {error: null};
          static getDerivedStateFromError(error) {
            return {error};
          }
          render() {
            if (this.state.error) {
              return <h1>Oops: {this.state.error.message}</h1>;
            }
            return this.props.children;
          }
        }

        function App() {
          return (
            <React.Fragment>
              <p>A</p>
              <Boundary>
                <Hello />
              </Boundary>
              <p>B</p>
            </React.Fragment>
          );
        }

        return App;
      });

      expect(container.innerHTML).toBe('<p>A</p><h1>Hi</h1><p>B</p>');
      const firstP = container.firstChild;
      const secondP = firstP.nextSibling.nextSibling;

      // Perform a hot update that fails.
      act(() => {
        patch(() => {
          function Hello() {
            const [x, setX] = React.useState('');
            React.useEffect(() => {
              setTimeout(() => {
                setX(42); // This will crash next render.
              }, 1);
            }, []);
            x.slice();
            return <h1>Hi</h1>;
          }
          __register__(Hello, 'Hello');
        });
      });

      expect(container.innerHTML).toBe('<p>A</p><h1>Hi</h1><p>B</p>');
      // Run timeout inside effect:
      act(() => {
        jest.runAllTimers();
      });
      expect(container.innerHTML).toBe(
        '<p>A</p><h1>Oops: x.slice is not a function</h1><p>B</p>',
      );
      expect(container.firstChild).toBe(firstP);
      expect(container.firstChild.nextSibling.nextSibling).toBe(secondP);

      // Perform a hot update that fixes the error.
      patch(() => {
        function Hello() {
          const [x] = React.useState('');
          React.useEffect(() => {}, []); // Removes the bad effect code.
          x.slice(); // Doesn't throw initially.
          return <h1>Fixed!</h1>;
        }
        __register__(Hello, 'Hello');
      });

      // This should remount the error boundary (but not anything above it).
      expect(container.innerHTML).toBe('<p>A</p><h1>Fixed!</h1><p>B</p>');
      expect(container.firstChild).toBe(firstP);
      expect(container.firstChild.nextSibling.nextSibling).toBe(secondP);

      // Verify next hot reload doesn't remount anything.
      const helloNode = container.firstChild.nextSibling;
      patch(() => {
        function Hello() {
          const [x] = React.useState('');
          React.useEffect(() => {}, []);
          x.slice();
          return <h1>Nice.</h1>;
        }
        __register__(Hello, 'Hello');
      });
      expect(container.firstChild.nextSibling).toBe(helloNode);
      expect(helloNode.textContent).toBe('Nice.');
    }
  });

  it('remounts classes on every edit', () => {
    if (__DEV__) {
      let HelloV1 = render(() => {
        class Hello extends React.Component {
          state = {count: 0};
          handleClick = () => {
            this.setState(prev => ({
              count: prev.count + 1,
            }));
          };
          render() {
            return (
              <p style={{color: 'blue'}} onClick={this.handleClick}>
                {this.state.count}
              </p>
            );
          }
        }
        // For classes, we wouldn't do this call via Babel plugin.
        // Instead, we'd do it at module boundaries.
        // Normally classes would get a different type and remount anyway,
        // but at module boundaries we may want to prevent propagation.
        // However we still want to force a remount and use latest version.
        __register__(Hello, 'Hello');
        return Hello;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update.
      let HelloV2 = patch(() => {
        class Hello extends React.Component {
          state = {count: 0};
          handleClick = () => {
            this.setState(prev => ({
              count: prev.count + 1,
            }));
          };
          render() {
            return (
              <p style={{color: 'red'}} onClick={this.handleClick}>
                {this.state.count}
              </p>
            );
          }
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // It should have remounted the class.
      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('red');
      act(() => {
        newEl.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(newEl.textContent).toBe('1');

      // Now top-level renders of both types resolve to latest.
      render(() => HelloV1);
      render(() => HelloV2);
      expect(container.firstChild).toBe(newEl);
      expect(newEl.style.color).toBe('red');
      expect(newEl.textContent).toBe('1');

      let HelloV3 = patch(() => {
        class Hello extends React.Component {
          state = {count: 0};
          handleClick = () => {
            this.setState(prev => ({
              count: prev.count + 1,
            }));
          };
          render() {
            return (
              <p style={{color: 'orange'}} onClick={this.handleClick}>
                {this.state.count}
              </p>
            );
          }
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // It should have remounted the class again.
      expect(container.firstChild).not.toBe(el);
      const finalEl = container.firstChild;
      expect(finalEl.textContent).toBe('0');
      expect(finalEl.style.color).toBe('orange');
      act(() => {
        finalEl.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(finalEl.textContent).toBe('1');

      render(() => HelloV3);
      render(() => HelloV2);
      render(() => HelloV1);
      expect(container.firstChild).toBe(finalEl);
      expect(finalEl.style.color).toBe('orange');
      expect(finalEl.textContent).toBe('1');
    }
  });

  it('remounts on conversion from class to function and back', () => {
    if (__DEV__) {
      let HelloV1 = render(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'blue'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // Bump the state before patching.
      const el = container.firstChild;
      expect(el.textContent).toBe('0');
      expect(el.style.color).toBe('blue');
      act(() => {
        el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(el.textContent).toBe('1');

      // Perform a hot update that turns it into a class.
      let HelloV2 = patch(() => {
        class Hello extends React.Component {
          state = {count: 0};
          handleClick = () => {
            this.setState(prev => ({
              count: prev.count + 1,
            }));
          };
          render() {
            return (
              <p style={{color: 'red'}} onClick={this.handleClick}>
                {this.state.count}
              </p>
            );
          }
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // It should have remounted.
      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('0');
      expect(newEl.style.color).toBe('red');
      act(() => {
        newEl.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(newEl.textContent).toBe('1');

      // Now top-level renders of both types resolve to latest.
      render(() => HelloV1);
      render(() => HelloV2);
      expect(container.firstChild).toBe(newEl);
      expect(newEl.style.color).toBe('red');
      expect(newEl.textContent).toBe('1');

      // Now convert it back to a function.
      let HelloV3 = patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'orange'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        return Hello;
      });

      // It should have remounted again.
      expect(container.firstChild).not.toBe(el);
      const finalEl = container.firstChild;
      expect(finalEl.textContent).toBe('0');
      expect(finalEl.style.color).toBe('orange');
      act(() => {
        finalEl.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(finalEl.textContent).toBe('1');

      render(() => HelloV3);
      render(() => HelloV2);
      render(() => HelloV1);
      expect(container.firstChild).toBe(finalEl);
      expect(finalEl.style.color).toBe('orange');
      expect(finalEl.textContent).toBe('1');

      // Now that it's a function, verify edits keep state.
      patch(() => {
        function Hello() {
          const [val, setVal] = React.useState(0);
          return (
            <p style={{color: 'purple'}} onClick={() => setVal(val + 1)}>
              {val}
            </p>
          );
        }
        __register__(Hello, 'Hello');
        return Hello;
      });
      expect(container.firstChild).toBe(finalEl);
      expect(finalEl.style.color).toBe('purple');
      expect(finalEl.textContent).toBe('1');
    }
  });

  it('can find host nodes for a family', () => {
    if (__DEV__) {
      render(() => {
        function Child({children}) {
          return <div className="Child">{children}</div>;
        }
        __register__(Child, 'Child');

        function Parent({children}) {
          return (
            <div className="Parent">
              <div>
                <Child />
              </div>
              <div>
                <Child />
              </div>
            </div>
          );
        }
        __register__(Parent, 'Parent');

        function App() {
          return (
            <div className="App">
              <Parent />
              <Cls>
                <Parent />
              </Cls>
              <Indirection>
                <Empty />
              </Indirection>
            </div>
          );
        }
        __register__(App, 'App');

        class Cls extends React.Component {
          render() {
            return this.props.children;
          }
        }

        function Indirection({children}) {
          return children;
        }

        function Empty() {
          return null;
        }
        __register__(Empty, 'Empty');

        function Frag() {
          return (
            <React.Fragment>
              <div className="Frag">
                <div />
              </div>
              <div className="Frag">
                <div />
              </div>
            </React.Fragment>
          );
        }
        __register__(Frag, 'Frag');

        return App;
      });

      const parentFamily = ReactFreshRuntime.getFamilyByID('Parent');
      const childFamily = ReactFreshRuntime.getFamilyByID('Child');
      const emptyFamily = ReactFreshRuntime.getFamilyByID('Empty');

      testFindNodesForFamilies(
        [parentFamily],
        container.querySelectorAll('.Parent'),
      );

      testFindNodesForFamilies(
        [childFamily],
        container.querySelectorAll('.Child'),
      );

      // When searching for both Parent and Child,
      // we'll stop visual highlighting at the Parent.
      testFindNodesForFamilies(
        [parentFamily, childFamily],
        container.querySelectorAll('.Parent'),
      );

      // When we can't find host nodes, use the closest parent.
      testFindNodesForFamilies(
        [emptyFamily],
        container.querySelectorAll('.App'),
      );
    }
  });

  function testFindNodesForFamilies(families, expectedNodes) {
    const foundNodes = Array.from(
      findHostNodesForHotUpdate(lastRoot, families),
    );
    expect(foundNodes.length).toEqual(expectedNodes.length);
    foundNodes.forEach((node, i) => {
      expect(node).toBe(expectedNodes[i]);
    });
  }
});
