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
let ReactFeatureFlags;
let ReactDOM;
let FocusWithinResponder;
let useFocusWithinResponder;

const createEvent = (type, data) => {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(type, true, true);
  if (data != null) {
    Object.entries(data).forEach(([key, value]) => {
      event[key] = value;
    });
  }
  return event;
};

const createKeyboardEvent = (type, data) => {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...data,
  });
};

const modulesInit = () => {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  FocusWithinResponder = require('react-events/focus').FocusWithinResponder;
  useFocusWithinResponder = require('react-events/focus')
    .useFocusWithinResponder;
};

describe('FocusWithin event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    modulesInit();

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
      ref.current.dispatchEvent(createEvent('focus'));
      ref.current.dispatchEvent(createEvent('blur'));
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
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    it('is called after "blur" and "focus" events on descendants', () => {
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    it('is only called once when focus moves within and outside the subtree', () => {
      // focus shifts into subtree
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: innerRef2.current}),
      );
      innerRef2.current.dispatchEvent(createEvent('focus'));
      innerRef2.current.dispatchEvent(
        createEvent('blur', {relatedTarget: ref.current}),
      );
      ref.current.dispatchEvent(createEvent('focus'));
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: innerRef.current}),
      );
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
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
      // use keyboard first
      container.dispatchEvent(createKeyboardEvent('keydown', {key: 'Tab'}));
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called after "focus" and "blur" on descendants if keyboard was used', () => {
      // use keyboard first
      container.dispatchEvent(createKeyboardEvent('keydown', {key: 'Tab'}));
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called if non-keyboard event is dispatched on target previously focused with keyboard', () => {
      // use keyboard first
      ref.current.dispatchEvent(createEvent('focus'));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Tab'}));
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: innerRef.current}),
      );
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the next target, focus should no longer be visible
      innerRef2.current.dispatchEvent(createEvent('pointerdown'));
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: innerRef2.current}),
      );
      innerRef2.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // then use keyboard again
      innerRef2.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Tab', shiftKey: true}),
      );
      innerRef2.current.dispatchEvent(
        createEvent('blur', {relatedTarget: innerRef.current}),
      );
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(3);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the target, focus should no longer be visible
      innerRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // onFocusVisibleChange should not be called again
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
    });

    it('is not called after "focus" and "blur" events without keyboard', () => {
      innerRef.current.dispatchEvent(createEvent('pointerdown'));
      innerRef.current.dispatchEvent(createEvent('focus'));
      container.dispatchEvent(createEvent('pointerdown'));
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(0);
    });

    it('is only called once when focus moves within and outside the subtree', () => {
      // focus shifts into subtree
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: innerRef2.current}),
      );
      innerRef2.current.dispatchEvent(createEvent('focus'));
      innerRef2.current.dispatchEvent(
        createEvent('blur', {relatedTarget: ref.current}),
      );
      ref.current.dispatchEvent(createEvent('focus'));
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: innerRef.current}),
      );
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(FocusWithinResponder.displayName).toBe('FocusWithin');
  });
});
