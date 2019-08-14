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
  platform,
  dispatchPointerPressDown,
  dispatchPointerPressRelease,
} from '../test-utils';

let React;
let ReactFeatureFlags;
let ReactDOM;
let FocusResponder;
let useFocusResponder;

function initializeModules(hasPointerEvents) {
  setPointerEvent(hasPointerEvents);
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  FocusResponder = require('react-events/focus').FocusResponder;
  useFocusResponder = require('react-events/focus').useFocusResponder;
}

const forcePointerEvents = true;
const table = [[forcePointerEvents], [!forcePointerEvents]];

describe.each(table)('Focus responder', hasPointerEvents => {
  let container;

  beforeEach(() => {
    initializeModules(hasPointerEvents);
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
        const listener = useFocusResponder({
          disabled: true,
          onBlur,
          onFocus,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('does not call callbacks', () => {
      const dispatch = arg => ref.current.dispatchEvent(arg);
      dispatch(focus());
      dispatch(blur());
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
        const listener = useFocusResponder({
          onBlur,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "blur" event', () => {
      const dispatch = arg => ref.current.dispatchEvent(arg);
      dispatch(focus());
      dispatch(blur());
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
        const listener = useFocusResponder({
          onFocus,
        });
        return (
          <div ref={ref} listeners={listener}>
            <a ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    };

    beforeEach(componentInit);

    it('is called after "focus" event', () => {
      ref.current.dispatchEvent(focus());
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('is not called if descendants of target receive focus', () => {
      innerRef.current.dispatchEvent(focus());
      expect(onFocus).not.toBeCalled();
    });

    it('is called with the correct pointerType: mouse', () => {
      const target = ref.current;
      dispatchPointerPressDown(target, {pointerType: 'mouse'});
      dispatchPointerPressRelease(target, {pointerType: 'mouse'});
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse'}),
      );
    });

    it('is called with the correct pointerType: touch', () => {
      const target = ref.current;
      dispatchPointerPressDown(target, {pointerType: 'touch'});
      dispatchPointerPressRelease(target, {pointerType: 'touch'});
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch'}),
      );
    });

    if (hasPointerEvents) {
      it('is called with the correct pointerType: pen', () => {
        const target = ref.current;
        dispatchPointerPressDown(target, {pointerType: 'pen'});
        dispatchPointerPressRelease(target, {pointerType: 'pen'});
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledWith(
          expect.objectContaining({pointerType: 'pen'}),
        );
      });
    }

    it('is called with the correct pointerType using a keyboard', () => {
      const target = ref.current;
      // Keyboard tab
      target.dispatchEvent(keydown({key: 'Tab'}));
      target.dispatchEvent(focus());
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard'}),
      );
    });

    it('is called with the correct pointerType using Tab+altKey on Mac', () => {
      platform.set('mac');
      jest.resetModules();
      initializeModules();
      componentInit();
      const target = ref.current;

      target.dispatchEvent(keydown({key: 'Tab', altKey: true}));
      target.dispatchEvent(focus());
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
        }),
      );

      platform.clear();
    });
  });

  describe('onFocusChange', () => {
    let onFocusChange, ref, innerRef;

    beforeEach(() => {
      onFocusChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      const Component = () => {
        const listener = useFocusResponder({
          onFocusChange,
        });
        return (
          <div ref={ref} listeners={listener}>
            <div ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "blur" and "focus" events', () => {
      const target = ref.current;
      target.dispatchEvent(focus());
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenCalledWith(true);
      target.dispatchEvent(blur());
      expect(onFocusChange).toHaveBeenCalledTimes(2);
      expect(onFocusChange).toHaveBeenCalledWith(false);
    });

    it('is not called after "blur" and "focus" events on descendants', () => {
      const target = innerRef.current;
      target.dispatchEvent(focus());
      expect(onFocusChange).toHaveBeenCalledTimes(0);
      target.dispatchEvent(blur());
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
        const listener = useFocusResponder({
          onFocusVisibleChange,
        });
        return (
          <div ref={ref} listeners={listener}>
            <div ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "focus" and "blur" if keyboard navigation is active', () => {
      const target = ref.current;
      // use keyboard first
      container.dispatchEvent(keydown({key: 'Tab'}));
      target.dispatchEvent(focus());
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(true);
      target.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(false);
    });

    it('is called if non-keyboard event is dispatched on target previously focused with keyboard', () => {
      const target = ref.current;
      // use keyboard first
      container.dispatchEvent(keydown({key: 'Tab'}));
      target.dispatchEvent(focus());
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the target, focus should no longer be visible
      dispatchPointerPressDown(target);
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(false);
      // onFocusVisibleChange should not be called again
      target.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('is not called after "focus" and "blur" events without keyboard', () => {
      const target = ref.current;
      dispatchPointerPressDown(target);
      dispatchPointerPressRelease(target);
      dispatchPointerPressDown(container);
      target.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
    });

    it('is not called after "blur" and "focus" events on descendants', () => {
      const target = innerRef.current;
      container.dispatchEvent(keydown({key: 'Tab'}));
      target.dispatchEvent(focus());
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
      target.dispatchEvent(blur({relatedTarget: container}));
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
    });
  });

  describe('nested Focus components', () => {
    it('propagates events in the correct order', () => {
      const events = [];
      const innerRef = React.createRef();
      const outerRef = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const Inner = () => {
        const listener = useFocusResponder({
          onBlur: createEventHandler('inner: onBlur'),
          onFocus: createEventHandler('inner: onFocus'),
          onFocusChange: createEventHandler('inner: onFocusChange'),
        });
        return <div ref={innerRef} listeners={listener} />;
      };

      const Outer = () => {
        const listener = useFocusResponder({
          onBlur: createEventHandler('outer: onBlur'),
          onFocus: createEventHandler('outer: onFocus'),
          onFocusChange: createEventHandler('outer: onFocusChange'),
        });
        return (
          <div ref={outerRef} listeners={listener}>
            <Inner />
          </div>
        );
      };

      ReactDOM.render(<Outer />, container);

      outerRef.current.dispatchEvent(focus());
      outerRef.current.dispatchEvent(blur());
      innerRef.current.dispatchEvent(focus());
      innerRef.current.dispatchEvent(blur());
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
