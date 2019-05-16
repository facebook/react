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
let Scheduler;
let act;

describe('ReactFresh', () => {
  let container;
  let familiesByID;
  let familiesByType;
  let newFamilies;
  let updatedFamilies;
  let performHotReload;
  let signaturesByType;

  beforeEach(() => {
    let scheduleHotUpdate;
    let lastRoot;
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: injected => {
        scheduleHotUpdate = injected.scheduleHotUpdate;
      },
      onCommitFiberRoot: (id, root) => {
        lastRoot = root;
      },
      onCommitFiberUnmount: () => {},
    };

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    act = require('react-dom/test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);

    familiesByID = new Map();
    familiesByType = new WeakMap();

    if (__DEV__) {
      performHotReload = function(staleFamilies) {
        scheduleHotUpdate({
          root: lastRoot,
          familiesByType,
          updatedFamilies,
          staleFamilies,
        });
      };
    }
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function prepare(version) {
    newFamilies = new Set();
    updatedFamilies = new Set();
    signaturesByType = new Map();
    const Component = version();

    // Fill in the signatures.
    for (let family of newFamilies) {
      const latestSignature = signaturesByType.get(family.currentType) || null;
      family.currentSignature = latestSignature;
    }

    newFamilies = null;
    updatedFamilies = null;
    signaturesByType = null;

    return Component;
  }

  function render(version, props) {
    const Component = prepare(version);
    act(() => {
      ReactDOM.render(<Component {...props} />, container);
    });
    return Component;
  }

  function patch(version) {
    // Will be filled in by __register__ calls in user code.
    newFamilies = new Set();
    updatedFamilies = new Set();
    signaturesByType = new Map();
    const Component = version();

    // Fill in the signatures.
    for (let family of newFamilies) {
      const latestSignature = signaturesByType.get(family.currentType) || null;
      family.currentSignature = latestSignature;
    }
    // Now that all registration and signatures are collected,
    // find which registrations changed their signatures since last time.
    const staleFamilies = new Set();
    for (let family of updatedFamilies) {
      const latestSignature = signaturesByType.get(family.currentType) || null;
      if (family.currentSignature !== latestSignature) {
        family.currentSignature = latestSignature;
        staleFamilies.add(family);
      }
    }

    performHotReload(staleFamilies);
    newFamilies = null;
    updatedFamilies = null;
    signaturesByType = null;
    return Component;
  }

  function __register__(type, id) {
    if (familiesByType.has(type)) {
      return;
    }
    let family = familiesByID.get(id);
    let isNew = false;
    if (family === undefined) {
      isNew = true;
      family = {currentType: type, currentSignature: null};
      familiesByID.set(id, family);
    }
    const prevType = family.currentType;
    if (isNew) {
      // The first time a type is registered, we don't need
      // any special reconciliation logic. So we won't add it to the map.
      // Instead, this will happen the firt time it is edited.
      newFamilies.add(family);
    } else {
      family.currentType = type;
      // Point both previous and next types to this family.
      familiesByType.set(prevType, family);
      familiesByType.set(type, family);
      updatedFamilies.add(family);
    }

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

  function __signature__(type, signature) {
    signaturesByType.set(type, signature);
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

      act(() => {
        el.firstChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
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

      // TODO: this part of the test doesn't work
      // because Sync updates in Offscreen trees
      // aren't actually delayed now. But they should be.
      // This needs to be fixed in React itself.

      // It's still offscreen so we don't see the updates.
      // expect(container.firstChild).toBe(el);
      // expect(el.firstChild.textContent).toBe('1');
      // expect(el.firstChild.style.color).toBe('red');
      // Process the offscreen updates.
      // expect(Scheduler).toFlushAndYieldThrough(['Hello#layout']);

      expect(container.firstChild).toBe(el);
      expect(el.firstChild.textContent).toBe('1');
      expect(el.firstChild.style.color).toBe('orange');
    }
  });
});
