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
let useFocus;
let Scheduler;

function initializeModules(hasPointerEvents) {
  setPointerEvent(hasPointerEvents);
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableModernEventSystem = true;
  ReactFeatureFlags.enableCreateEventHandleAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  Scheduler = require('scheduler');

  // TODO: This import throws outside of experimental mode. Figure out better
  // strategy for gated imports.
  if (__EXPERIMENTAL__) {
    useFocus = require('react-interactions/events/focus').useFocus;
  }
}

const forcePointerEvents = true;
const table = [[forcePointerEvents], [!forcePointerEvents]];

describe.each(table)(`useFocus`, hasPointerEvents => {
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

    const componentInit = () => {
      onBlur = jest.fn();
      onFocus = jest.fn();
      ref = React.createRef();
      const Component = () => {
        useFocus(ref, {
          disabled: true,
          onBlur,
          onFocus,
        });
        return <div ref={ref} />;
      };
      ReactDOM.render(<Component />, container);
      Scheduler.unstable_flushAll();
    };

    // @gate experimental
    it('does not call callbacks', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.focus();
      target.blur();
      expect(onFocus).not.toBeCalled();
      expect(onBlur).not.toBeCalled();
    });
  });

  describe('onBlur', () => {
    let onBlur, ref;

    const componentInit = () => {
      onBlur = jest.fn();
      ref = React.createRef();
      const Component = () => {
        useFocus(ref, {
          onBlur,
        });
        return <div ref={ref} />;
      };
      ReactDOM.render(<Component />, container);
      Scheduler.unstable_flushAll();
    };

    // @gate experimental
    it('is called after "blur" event', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.focus();
      target.blur();
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
        useFocus(ref, {
          onFocus,
        });
        return (
          <div ref={ref}>
            <a ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
      Scheduler.unstable_flushAll();
    };

    // @gate experimental
    it('is called after "focus" event', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.focus();
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    // @gate experimental
    it('is not called if descendants of target receive focus', () => {
      componentInit();
      const target = createEventTarget(innerRef.current);
      target.focus();
      expect(onFocus).not.toBeCalled();
    });
  });

  describe('onFocusChange', () => {
    let onFocusChange, ref, innerRef;

    const componentInit = () => {
      onFocusChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      const Component = () => {
        useFocus(ref, {
          onFocusChange,
        });
        return (
          <div ref={ref}>
            <div ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
      Scheduler.unstable_flushAll();
    };

    // @gate experimental
    it('is called after "blur" and "focus" events', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.focus();
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenCalledWith(true);
      target.blur();
      expect(onFocusChange).toHaveBeenCalledTimes(2);
      expect(onFocusChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is not called after "blur" and "focus" events on descendants', () => {
      componentInit();
      const target = createEventTarget(innerRef.current);
      target.focus();
      expect(onFocusChange).toHaveBeenCalledTimes(0);
      target.blur();
      expect(onFocusChange).toHaveBeenCalledTimes(0);
    });
  });

  describe('onFocusVisibleChange', () => {
    let onFocusVisibleChange, ref, innerRef;

    const componentInit = () => {
      onFocusVisibleChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      const Component = () => {
        useFocus(ref, {
          onFocusVisibleChange,
        });
        return (
          <div ref={ref}>
            <div ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
      Scheduler.unstable_flushAll();
    };

    // @gate experimental
    it('is called after "focus" and "blur" if keyboard navigation is active', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const containerTarget = createEventTarget(container);
      // use keyboard first
      containerTarget.keydown({key: 'Tab'});
      target.focus();
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(true);
      target.blur({relatedTarget: container});
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is called if non-keyboard event is dispatched on target previously focused with keyboard', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const containerTarget = createEventTarget(container);
      // use keyboard first
      containerTarget.keydown({key: 'Tab'});
      target.focus();
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the target, focus should no longer be visible
      target.pointerdown();
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusVisibleChange).toHaveBeenCalledWith(false);
      // onFocusVisibleChange should not be called again
      target.blur({relatedTarget: container});
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(2);
    });

    // @gate experimental
    it('is not called after "focus" and "blur" events without keyboard', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const containerTarget = createEventTarget(container);
      target.pointerdown();
      target.pointerup();
      containerTarget.pointerdown();
      target.blur({relatedTarget: container});
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
    });

    // @gate experimental
    it('is not called after "blur" and "focus" events on descendants', () => {
      componentInit();
      const innerTarget = createEventTarget(innerRef.current);
      const containerTarget = createEventTarget(container);
      containerTarget.keydown({key: 'Tab'});
      innerTarget.focus();
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
      innerTarget.blur({relatedTarget: container});
      expect(onFocusVisibleChange).toHaveBeenCalledTimes(0);
    });
  });

  describe('nested Focus components', () => {
    // @gate experimental
    it('propagates events in the correct order', () => {
      const events = [];
      const innerRef = React.createRef();
      const outerRef = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const Inner = () => {
        useFocus(innerRef, {
          onBlur: createEventHandler('inner: onBlur'),
          onFocus: createEventHandler('inner: onFocus'),
          onFocusChange: createEventHandler('inner: onFocusChange'),
        });
        return <div ref={innerRef} />;
      };

      const Outer = () => {
        useFocus(outerRef, {
          onBlur: createEventHandler('outer: onBlur'),
          onFocus: createEventHandler('outer: onFocus'),
          onFocusChange: createEventHandler('outer: onFocusChange'),
        });
        return (
          <div ref={outerRef}>
            <Inner />
          </div>
        );
      };

      ReactDOM.render(<Outer />, container);
      Scheduler.unstable_flushAll();

      const innerTarget = createEventTarget(innerRef.current);
      const outerTarget = createEventTarget(outerRef.current);

      outerTarget.focus();
      outerTarget.blur();
      innerTarget.focus();
      innerTarget.blur();
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
});
