/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let act;

describe('ReactFresh', () => {
  let container;
  let familiesByID;
  let familiesByType;
  let updatedFamilies;
  let performHotReload;

  beforeEach(() => {
    let enableHotReloading;
    let lastRoot;
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: injected => {
        enableHotReloading = injected.enableHotReloading;
      },
      onCommitFiberRoot: (id, root) => {
        lastRoot = root;
      },
      onCommitFiberUnmount: () => {},
    };

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    act = require('react-dom/test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);
    familiesByID = new Map();
    familiesByType = new WeakMap();

    if (__DEV__) {
      const {scheduleHotUpdate} = enableHotReloading(familiesByType);
      performHotReload = function(families) {
        scheduleHotUpdate(lastRoot, families);
      };
    }
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function render(version, props) {
    updatedFamilies = new Set();
    const Component = version();
    updatedFamilies = null;
    act(() => {
      ReactDOM.render(<Component {...props} />, container);
    });
    return Component;
  }

  function patch(version) {
    updatedFamilies = new Set();
    const Component = version();
    performHotReload(updatedFamilies);
    updatedFamilies = null;
    return Component;
  }

  function __register__(type, id) {
    if (familiesByType.has(type)) {
      return;
    }
    let family = familiesByID.get(id);
    if (family === undefined) {
      family = {current: null};
      familiesByID.set(id, family);
    }
    family.current = type;
    familiesByType.set(type, family);
    updatedFamilies.add(family);
    // TODO: invalidation based on signatures.

    if (typeof type === 'object' && type !== null) {
      switch (type.$$typeof) {
        case Symbol.for('react.forward_ref'):
          __register__(type.render, id + '$render');
          break;
        case Symbol.for('react.memo'):
          __register__(type.type, id + '$type');
          break;
      }
    }
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

      // TODO: remove this when we fix bailouts:
      render(() => OuterV2, {cacheBreaker: 'foo'});

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
      const OuterV1 = render(() => {
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

      // TODO: remove this when we fix bailouts:
      render(() => OuterV1, {cacheBreaker: 'foo'});

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
    }
  });
});
