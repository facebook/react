/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {
  blur,
  focus,
  keydown,
  setPointerEvent,
  dispatchPointerDown,
  dispatchPointerUp,
} from '../test-utils';

let React;
let ReactFeatureFlags;
let ReactDOM;
let FocusWithinResponder;
let useFocusWithinResponder;

const initializeModules = hasPointerEvents => {
  setPointerEvent(hasPointerEvents);
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  FocusWithinResponder = require('react-events/focus').FocusWithinResponder;
  useFocusWithinResponder = require('react-events/focus')
    .useFocusWithinResponder;
};

const forcePointerEvents = true;
const table = [[forcePointerEvents], [!forcePointerEvents]];

describe.each(table)('FocusWithin responder', hasPointerEvents => {
  let container;

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
        const listener = useFocusWithinResponder({
          disabled: true,
          onFocusWithinChange,
          onFocusWithinVisibleChange,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('prevents custom events being dispatched', () => {
      const target = ref.current;
      target.dispatchEvent(focus());
      target.dispatchEvent(blur());
      expect(onFocusWithinChange).not.toBeCalled();
      expect(onFocusWithinVisibleChange).not.toBeCalled();
    });
  });

  describe('onFocusWithinChange', () => {
    let onFocusWithinChange, ref, innerRef, innerRef2;

    beforeEach(() => {
      onFocusWithinChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
      const Component = () => {
        const listener = useFocusWithinResponder({
          onFocusWithinChange,
        });
        return (
          <div ref={ref} listeners={listener}>
            <div ref={innerRef} />
            <div ref={innerRef2} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "blur" and "focus" events on focus target', () => {
      const target = ref.current;
      target.dispatchEvent(focus());
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      target.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    it('is called after "blur" and "focus" events on descendants', () => {
      const target = innerRef.current;
      target.dispatchEvent(focus());
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      target.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    it('is only called once when focus moves within and outside the subtree', () => {
      const target = ref.current;
      const innerTarget1 = innerRef.current;
      const innerTarget2 = innerRef2.current;
      // focus shifts into subtree
      innerTarget1.dispatchEvent(focus());
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerTarget1.dispatchEvent(blur({relatedTarget: innerTarget2}));
      innerTarget2.dispatchEvent(focus());
      innerTarget2.dispatchEvent(blur({relatedTarget: target}));
      target.dispatchEvent(focus());
      target.dispatchEvent(blur({relatedTarget: innerTarget1}));
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerTarget1.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onFocusWithinVisibleChange', () => {
    let onFocusWithinVisibleChange, ref, innerRef, innerRef2;

    beforeEach(() => {
      onFocusWithinVisibleChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
      const Component = () => {
        const listener = useFocusWithinResponder({
          onFocusWithinVisibleChange,
        });
        return (
          <div ref={ref} listeners={listener}>
            <div ref={innerRef} />
            <div ref={innerRef2} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "focus" and "blur" on focus target if keyboard was used', () => {
      const target = ref.current;
      // use keyboard first
      container.dispatchEvent(keydown({key: 'Tab'}));
      target.dispatchEvent(focus());
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      target.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called after "focus" and "blur" on descendants if keyboard was used', () => {
      const innerTarget = innerRef.current;
      // use keyboard first
      container.dispatchEvent(keydown({key: 'Tab'}));
      innerTarget.dispatchEvent(focus());
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      innerTarget.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called if non-keyboard event is dispatched on target previously focused with keyboard', () => {
      const target = ref.current;
      const innerTarget1 = innerRef.current;
      const innerTarget2 = innerRef2.current;
      // use keyboard first
      target.dispatchEvent(focus());
      target.dispatchEvent(keydown({key: 'Tab'}));
      target.dispatchEvent(blur({relatedTarget: innerTarget1}));
      innerTarget1.dispatchEvent(focus());
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the next target, focus should no longer be visible
      dispatchPointerDown(innerTarget2);
      innerTarget1.dispatchEvent(blur({relatedTarget: innerTarget2}));
      innerTarget2.dispatchEvent(focus());
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // then use keyboard again
      innerTarget2.dispatchEvent(keydown({key: 'Tab', shiftKey: true}));
      innerTarget2.dispatchEvent(blur({relatedTarget: innerTarget1}));
      innerTarget1.dispatchEvent(focus());
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(3);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the target, focus should no longer be visible
      dispatchPointerDown(innerTarget1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // onFocusVisibleChange should not be called again
      innerTarget1.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
    });

    it('is not called after "focus" and "blur" events without keyboard', () => {
      const innerTarget = innerRef.current;
      dispatchPointerDown(innerTarget);
      dispatchPointerUp(innerTarget);
      innerTarget.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(0);
    });

    it('is only called once when focus moves within and outside the subtree', () => {
      const target = ref.current;
      const innerTarget1 = innerRef.current;
      const innerTarget2 = innerRef2.current;

      // focus shifts into subtree
      innerTarget1.dispatchEvent(focus());
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerTarget1.dispatchEvent(blur({relatedTarget: innerTarget2}));
      innerTarget2.dispatchEvent(focus());
      innerTarget2.dispatchEvent(blur({relatedTarget: target}));
      target.dispatchEvent(focus());
      target.dispatchEvent(blur({relatedTarget: innerTarget1}));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerTarget1.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(FocusWithinResponder.displayName).toBe('FocusWithin');
  });
});
