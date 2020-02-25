/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget, setPointerEvent} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let FocusWithinResponder;
let useFocusWithin;
let Scheduler;

const initializeModules = hasPointerEvents => {
  setPointerEvent(hasPointerEvents);
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableDeprecatedFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  FocusWithinResponder = require('react-interactions/events/focus')
    .FocusWithinResponder;
  useFocusWithin = require('react-interactions/events/focus').useFocusWithin;
  Scheduler = require('scheduler');
};

const forcePointerEvents = true;
const table = [[forcePointerEvents], [!forcePointerEvents]];

describe.each(table)('FocusWithin responder', hasPointerEvents => {
  let container;

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  beforeEach(() => {
    initializeModules();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onFocusWithinChange, onFocusWithinVisibleChange, ref;

    beforeEach(() => {
      onFocusWithinChange = jest.fn();
      onFocusWithinVisibleChange = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useFocusWithin({
          disabled: true,
          onFocusWithinChange,
          onFocusWithinVisibleChange,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('prevents custom events being dispatched', () => {
      const target = createEventTarget(ref.current);
      target.focus();
      target.blur();
      expect(onFocusWithinChange).not.toBeCalled();
      expect(onFocusWithinVisibleChange).not.toBeCalled();
    });
  });

  describe('onFocusWithinChange', () => {
    let onFocusWithinChange, ref, innerRef, innerRef2;

    const Component = ({show}) => {
      const listener = useFocusWithin({
        onFocusWithinChange,
      });
      return (
        <div ref={ref} DEPRECATED_flareListeners={listener}>
          {show && <input ref={innerRef} />}
          <div ref={innerRef2} />
        </div>
      );
    };

    beforeEach(() => {
      onFocusWithinChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
      ReactDOM.render(<Component show={true} />, container);
    });

    it('is called after "blur" and "focus" events on focus target', () => {
      const target = createEventTarget(ref.current);
      target.focus();
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      target.blur({relatedTarget: container});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    it('is called after "blur" and "focus" events on descendants', () => {
      const target = createEventTarget(innerRef.current);
      target.focus();
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      target.blur({relatedTarget: container});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    it('is only called once when focus moves within and outside the subtree', () => {
      const node = ref.current;
      const innerNode1 = innerRef.current;
      const innerNode2 = innerRef.current;
      const target = createEventTarget(node);
      const innerTarget1 = createEventTarget(innerNode1);
      const innerTarget2 = createEventTarget(innerNode2);

      // focus shifts into subtree
      innerTarget1.focus();
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerTarget1.blur({relatedTarget: innerNode2});
      innerTarget2.focus();
      innerTarget2.blur({relatedTarget: node});
      target.focus();
      target.blur({relatedTarget: innerNode1});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerTarget1.blur({relatedTarget: container});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onFocusWithinVisibleChange', () => {
    let onFocusWithinVisibleChange, ref, innerRef, innerRef2;

    const Component = ({show}) => {
      const listener = useFocusWithin({
        onFocusWithinVisibleChange,
      });
      return (
        <div ref={ref} DEPRECATED_flareListeners={listener}>
          {show && <input ref={innerRef} />}
          <div ref={innerRef2} />
        </div>
      );
    };

    beforeEach(() => {
      onFocusWithinVisibleChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
      ReactDOM.render(<Component show={true} />, container);
    });

    it('is called after "focus" and "blur" on focus target if keyboard was used', () => {
      const target = createEventTarget(ref.current);
      const containerTarget = createEventTarget(container);
      // use keyboard first
      containerTarget.keydown({key: 'Tab'});
      target.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      target.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called after "focus" and "blur" on descendants if keyboard was used', () => {
      const innerTarget = createEventTarget(innerRef.current);
      const containerTarget = createEventTarget(container);
      // use keyboard first
      containerTarget.keydown({key: 'Tab'});
      innerTarget.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      innerTarget.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called if non-keyboard event is dispatched on target previously focused with keyboard', () => {
      const node = ref.current;
      const innerNode1 = innerRef.current;
      const innerNode2 = innerRef2.current;

      const target = createEventTarget(node);
      const innerTarget1 = createEventTarget(innerNode1);
      const innerTarget2 = createEventTarget(innerNode2);
      // use keyboard first
      target.focus();
      target.keydown({key: 'Tab'});
      target.blur({relatedTarget: innerNode1});
      innerTarget1.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the next target, focus should no longer be visible
      innerTarget2.pointerdown();
      innerTarget1.blur({relatedTarget: innerNode2});
      innerTarget2.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // then use keyboard again
      innerTarget2.keydown({key: 'Tab', shiftKey: true});
      innerTarget2.blur({relatedTarget: innerNode1});
      innerTarget1.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(3);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the target, focus should no longer be visible
      innerTarget1.pointerdown();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // onFocusVisibleChange should not be called again
      innerTarget1.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
    });

    it('is not called after "focus" and "blur" events without keyboard', () => {
      const innerTarget = createEventTarget(innerRef.current);
      innerTarget.pointerdown();
      innerTarget.pointerup();
      innerTarget.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(0);
    });

    it('is only called once when focus moves within and outside the subtree', () => {
      const node = ref.current;
      const innerNode1 = innerRef.current;
      const innerNode2 = innerRef2.current;
      const target = createEventTarget(node);
      const innerTarget1 = createEventTarget(innerNode1);
      const innerTarget2 = createEventTarget(innerNode2);

      // focus shifts into subtree
      innerTarget1.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerTarget1.blur({relatedTarget: innerNode2});
      innerTarget2.focus();
      innerTarget2.blur({relatedTarget: node});
      target.focus();
      target.blur({relatedTarget: innerNode1});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerTarget1.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onBeforeBlurWithin', () => {
    let onBeforeBlurWithin, onBlurWithin, ref, innerRef, innerRef2;

    beforeEach(() => {
      onBeforeBlurWithin = jest.fn();
      onBlurWithin = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
    });

    it('is called after a focused element is unmounted', () => {
      const Component = ({show}) => {
        const listener = useFocusWithin({
          onBeforeBlurWithin,
          onBlurWithin,
        });
        return (
          <div ref={ref} DEPRECATED_flareListeners={listener}>
            {show && <input ref={innerRef} />}
            <div ref={innerRef2} />
          </div>
        );
      };

      ReactDOM.render(<Component show={true} />, container);

      const inner = innerRef.current;
      const target = createEventTarget(inner);
      target.keydown({key: 'Tab'});
      target.focus();
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(0);
      expect(onBlurWithin).toHaveBeenCalledTimes(0);
      ReactDOM.render(<Component show={false} />, container);
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(1);
      expect(onBlurWithin).toHaveBeenCalledTimes(1);
      expect(onBlurWithin).toHaveBeenCalledWith(
        expect.objectContaining({isTargetAttached: false}),
      );
    });

    it('is called after a nested focused element is unmounted', () => {
      const Component = ({show}) => {
        const listener = useFocusWithin({
          onBeforeBlurWithin,
          onBlurWithin,
        });
        return (
          <div ref={ref} DEPRECATED_flareListeners={listener}>
            {show && (
              <div>
                <input ref={innerRef} />
              </div>
            )}
            <div ref={innerRef2} />
          </div>
        );
      };

      ReactDOM.render(<Component show={true} />, container);

      const inner = innerRef.current;
      const target = createEventTarget(inner);
      target.keydown({key: 'Tab'});
      target.focus();
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(0);
      expect(onBlurWithin).toHaveBeenCalledTimes(0);
      ReactDOM.render(<Component show={false} />, container);
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(1);
      expect(onBlurWithin).toHaveBeenCalledTimes(1);
      expect(onBlurWithin).toHaveBeenCalledWith(
        expect.objectContaining({isTargetAttached: false}),
      );
    });

    it.experimental(
      'is called after a focused suspended element is hidden',
      () => {
        const Suspense = React.Suspense;
        let suspend = false;
        let resolve;
        let promise = new Promise(resolvePromise => (resolve = resolvePromise));

        function Child() {
          if (suspend) {
            throw promise;
          } else {
            return <input ref={innerRef} />;
          }
        }

        const Component = ({show}) => {
          const listener = useFocusWithin({
            onBeforeBlurWithin,
            onBlurWithin,
          });

          return (
            <div DEPRECATED_flareListeners={listener}>
              <Suspense fallback="Loading...">
                <Child />
              </Suspense>
            </div>
          );
        };

        const container2 = document.createElement('div');
        document.body.appendChild(container2);

        let root = ReactDOM.createRoot(container2);
        root.render(<Component />);
        Scheduler.unstable_flushAll();
        jest.runAllTimers();
        expect(container2.innerHTML).toBe('<div><input></div>');

        const inner = innerRef.current;
        const target = createEventTarget(inner);
        target.keydown({key: 'Tab'});
        target.focus();
        expect(onBeforeBlurWithin).toHaveBeenCalledTimes(0);
        expect(onBlurWithin).toHaveBeenCalledTimes(0);

        suspend = true;
        root.render(<Component />);
        Scheduler.unstable_flushAll();
        jest.runAllTimers();
        expect(container2.innerHTML).toBe(
          '<div><input style="display: none;">Loading...</div>',
        );
        expect(onBeforeBlurWithin).toHaveBeenCalledTimes(1);
        expect(onBlurWithin).toHaveBeenCalledTimes(1);
        resolve();

        document.body.removeChild(container2);
      },
    );
  });

  it('expect displayName to show up for event component', () => {
    expect(FocusWithinResponder.displayName).toBe('FocusWithin');
  });
});
