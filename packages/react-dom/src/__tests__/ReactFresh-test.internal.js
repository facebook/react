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

  function render(version) {
    updatedFamilies = new Set();
    const Component = version();
    updatedFamilies = null;
    act(() => {
      ReactDOM.render(<Component />, container);
    });
  }

  function patch(version) {
    updatedFamilies = new Set();
    version();
    performHotReload(updatedFamilies);
    updatedFamilies = null;
  }

  function __register__(fn, id) {
    let family = familiesByID.get(id);
    if (family === undefined) {
      family = {current: null};
      familiesByID.set(id, family);
    }
    family.current = fn;
    familiesByType.set(fn, family);
    updatedFamilies.add(family);
    // TODO: invalidation based on signatures.
  }

  it('can preserve state', () => {
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

      // TODO: test reconciliation with old type.
    }
  });
});
