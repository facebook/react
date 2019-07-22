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
let FocusResponder;
let FocusWithinResponder;
let useFocusListener;
let useFocusWithinListener;

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
  FocusResponder = require('react-events/focus').FocusResponder;
  FocusWithinResponder = require('react-events/focus').FocusWithinResponder;
  useFocusListener = require('react-events/focus').useFocusListener;
  useFocusWithinListener = require('react-events/focus').useFocusWithinListener;
};

describe('Focus event responder', () => {
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
    let onBlur, onFocus, ref;

    beforeEach(() => {
      onBlur = jest.fn();
      onFocus = jest.fn();
      ref = React.createRef();
      const Component = () => {
        useFocusListener({
          onBlur,
          onFocus,
        });
        return (
          <div ref={ref} responders={<FocusResponder disabled={true} />} />
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createEvent('focus'));
      ref.current.dispatchEvent(createEvent('blur'));
      expect(onFocus).not.toBeCalled();
      expect(onBlur).not.toBeCalled();
    });
  });

  describe('onBlur', () => {
    let onBlur, ref;

    beforeEach(() => {
      onBlur = jest.fn();
      ref = React.createRef();
      const Component = () => {
        useFocusListener({
          onBlur,
        });
        return <div ref={ref} responders={<FocusResponder />} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "blur" event', () => {
      ref.current.dispatchEvent(createEvent('focus'));
      ref.current.dispatchEvent(createEvent('blur'));
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('onFocus', () => {
    let onFocus, ref, innerRef;

    const componentInit = () => {
      onFocus = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      const Component = () => {
        useFocusListener({
          onFocus,
        });
        return (
          <div ref={ref} responders={<FocusResponder />}>
            <a ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    };

    beforeEach(componentInit);

    it('is called after "focus" event', () => {
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('is not called if descendants of target receive focus', () => {
      const target = innerRef.current;
      target.dispatchEvent(createEvent('focus'));
      expect(onFocus).not.toBeCalled();
    });

    it('is called with the correct pointerType using pointer events', () => {
      // Pointer mouse
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'mouse',
        }),
      );
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse'}),
      );
      ref.current.dispatchEvent(createEvent('blur'));

      // Pointer touch
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(2);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(createEvent('blur'));

      // Pointer pen
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'pen',
        }),
      );
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(3);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen'}),
      );
    });

    it('is called with the correct pointerType without pointer events', () => {
      // Mouse
      ref.current.dispatchEvent(createEvent('mousedown'));
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse'}),
      );
      ref.current.dispatchEvent(createEvent('blur'));

      // Touch
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(2);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch'}),
      );
    });

    it('is called with the correct pointerType using a keyboard', () => {
      // Keyboard tab
      ref.current.dispatchEvent(
        createEvent('keydown', {
          key: 'Tab',
        }),
      );
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard'}),
      );
    });

    it('is called with the correct pointerType using Tab+altKey on Mac', () => {
      jest.resetModules();
      const platformGetter = jest.spyOn(global.navigator, 'platform', 'get');
      platformGetter.mockReturnValue('MacIntel');
      modulesInit();
      componentInit();

      ref.current.dispatchEvent(
        createEvent('keydown', {
          key: 'Tab',
          altKey: true,
        }),
      );
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
        }),
      );

      platformGetter.mockClear();
    });
  });

  describe('onFocusChange', () => {
    let onFocusChange, ref, innerRef;

    beforeEach(() => {
      onFocusChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      const Component = () => {
        useFocusListener({
          onFocusChange,
        });
        return (
          <div ref={ref} responders={<FocusResponder />}>
            <div ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "blur" and "focus" events', () => {
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('blur'));
      expect(onFocusChange).toHaveBeenCalledTimes(2);
      expect(onFocusChange).toHaveBeenCalledWith(false);
    });

    it('is not called after "blur" and "focus" events on descendants', () => {
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusChange).toHaveBeenCalledTimes(0);
      innerRef.current.dispatchEvent(createEvent('blur'));
      expect(onFocusChange).toHaveBeenCalledTimes(0);
    });
  });

  describe('onFocusVisibleChange', () => {
    let onFocusVisibleChange, ref, innerRef;

    beforeEach(() => {
      onFocusVisibleChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      const Component = () => {
        useFocusListener({
          onFocusVisibleChange,
        });
        return (
          <div ref={ref} responders={<FocusResponder />}>
            <div ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "focus" and "blur" if keyboard navigation is active', () => {
      // use keyboard first
      container.dispatchEvent(createKeyboardEvent('keydown', {key: 'Tab'}));
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called if non-keyboard event is dispatched on target previously focused with keyboard', () => {
      // use keyboard first
      container.dispatchEvent(createKeyboardEvent('keydown', {key: 'Tab'}));
      ref.current.dispatchEvent(createEvent('focus'));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the target, focus should no longer be visible
      ref.current.dispatchEvent(createEvent('pointerdown'));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(false);
      // onFocusVisibleChange should not be called again
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('is not called after "focus" and "blur" events without keyboard', () => {
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('focus'));
      container.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
    });

    it('is not called after "blur" and "focus" events on descendants', () => {
      container.dispatchEvent(createKeyboardEvent('keydown', {key: 'Tab'}));
      innerRef.current.dispatchEvent(createEvent('focus'));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
      innerRef.current.dispatchEvent(
        createEvent('blur', {relatedTarget: container}),
      );
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
    });
  });

  describe('nested Focus components', () => {
    it('do not propagate events by default', () => {
      const events = [];
      const innerRef = React.createRef();
      const outerRef = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const Inner = () => {
        useFocusListener({
          onBlur: createEventHandler('inner: onBlur'),
          onFocus: createEventHandler('inner: onFocus'),
          onFocusChange: createEventHandler('inner: onFocusChange'),
        });
        return <div ref={innerRef} responders={<FocusResponder />} />;
      };

      const Outer = () => {
        useFocusListener({
          onBlur: createEventHandler('outer: onBlur'),
          onFocus: createEventHandler('outer: onFocus'),
          onFocusChange: createEventHandler('outer: onFocusChange'),
        });
        return (
          <div ref={outerRef} responders={<FocusResponder />}>
            <Inner />
          </div>
        );
      };

      ReactDOM.render(<Outer />, container);

      outerRef.current.dispatchEvent(createEvent('focus'));
      outerRef.current.dispatchEvent(createEvent('blur'));
      innerRef.current.dispatchEvent(createEvent('focus'));
      innerRef.current.dispatchEvent(createEvent('blur'));
      expect(events).toEqual([
        'outer: onFocus',
        'outer: onFocusChange',
        'outer: onBlur',
        'outer: onFocusChange',
        'inner: onFocus',
        'inner: onFocusChange',
        'inner: onBlur',
        'inner: onFocusChange',
      ]);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(FocusResponder.displayName).toBe('Focus');
  });
});

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
        useFocusWithinListener({
          onFocusWithinChange,
          onFocusWithinVisibleChange,
        });
        return (
          <div
            ref={ref}
            responders={<FocusWithinResponder disabled={true} />}
          />
        );
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
        useFocusWithinListener({
          onFocusWithinChange,
        });
        return (
          <div ref={ref} responders={<FocusWithinResponder />}>
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
        useFocusWithinListener({
          onFocusWithinVisibleChange,
        });
        return (
          <div ref={ref} responders={<FocusWithinResponder />}>
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
