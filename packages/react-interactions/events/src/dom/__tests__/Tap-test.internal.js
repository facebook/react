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
  buttonsType,
  createEventTarget,
  describeWithPointerEvent,
  setPointerEvent,
  testWithPointerType,
} from '../testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let useTap;

function initializeModules(hasPointerEvents) {
  jest.resetModules();
  setPointerEvent(hasPointerEvents);
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  useTap = require('react-interactions/events/tap').useTap;
}

const coordinatesInside = {x: 51, y: 51};
const coordinatesOutside = {x: 49, y: 49};

function tapAndMoveOutside({
  hasPointerEvents,
  pointerType,
  downTarget,
  upTarget,
}) {
  downTarget.setBoundingClientRect({width: 100, height: 100, x: 50, y: 50});
  downTarget.pointerdown({pointerType, ...coordinatesInside});
  downTarget.pointermove({pointerType, ...coordinatesInside});
  // NOTE: this assumes the PointerEvent implementation calls
  // 'releasePointerCapture' for touch pointers
  if (!hasPointerEvents && pointerType === 'touch') {
    document.elementFromPoint = () => upTarget.node;
    downTarget.pointermove({pointerType, ...coordinatesOutside});
  } else {
    upTarget.pointermove({pointerType, ...coordinatesOutside});
  }
}

function tapAndReleaseOutside({
  hasPointerEvents,
  pointerType,
  downTarget,
  upTarget,
}) {
  tapAndMoveOutside({hasPointerEvents, pointerType, downTarget, upTarget});
  if (!hasPointerEvents && pointerType === 'touch') {
    downTarget.pointerup({pointerType, ...coordinatesOutside});
  } else {
    upTarget.pointerup({pointerType, ...coordinatesOutside});
  }
}

describeWithPointerEvent('Tap responder', hasPointerEvents => {
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

  test('supports repeated use', () => {
    const ref = React.createRef();
    const Component = () => {
      const listener = useTap();
      return <button ref={ref} listeners={listener} />;
    };
    ReactDOM.render(<Component />, container);

    const target = createEventTarget(ref.current);
    function interact() {
      target.pointerdown();
      target.pointermove();
      target.pointerup();
    }
    expect(() => {
      interact();
      interact();
    }).not.toThrow();
  });

  describe('disabled', () => {
    let onTapStart, onTapChange, onTapUpdate, onTapCancel, onTapEnd, ref;

    beforeEach(() => {
      onTapStart = jest.fn();
      onTapChange = jest.fn();
      onTapUpdate = jest.fn();
      onTapCancel = jest.fn();
      onTapEnd = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useTap({
          disabled: true,
          onTapStart,
          onTapChange,
          onTapUpdate,
          onTapCancel,
          onTapEnd,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    test('does not call callbacks', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup();
      expect(onTapStart).not.toBeCalled();
      expect(onTapChange).not.toBeCalled();
      expect(onTapUpdate).not.toBeCalled();
      expect(onTapCancel).not.toBeCalled();
      expect(onTapEnd).not.toBeCalled();
    });
  });

  describe('maximumDistance', () => {
    let onTapCancel, onTapUpdate, ref;

    function render(props) {
      const Component = () => {
        const listener = useTap(props);
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    }

    beforeEach(() => {
      onTapCancel = jest.fn();
      onTapUpdate = jest.fn();
      ref = React.createRef();
      render({
        maximumDistance: 20,
        onTapCancel,
        onTapUpdate,
      });
    });

    test('ignores values less than 10', () => {
      render({
        maximumDistance: 5,
        onTapCancel,
        onTapUpdate,
      });
      const target = createEventTarget(ref.current);
      const pointerType = 'mouse';
      target.pointerdown({pointerType, x: 0, y: 0});
      target.pointermove({pointerType, x: 10, y: 10});
      expect(onTapUpdate).toHaveBeenCalledTimes(1);
      expect(onTapCancel).toHaveBeenCalledTimes(0);
    });

    testWithPointerType('below threshold', pointerType => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType, x: 0, y: 0});
      target.pointermove({pointerType, x: 10, y: 10});
      expect(onTapUpdate).toHaveBeenCalledTimes(1);
      expect(onTapCancel).toHaveBeenCalledTimes(0);
    });

    testWithPointerType('above threshold', pointerType => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType, x: 0, y: 0});
      target.pointermove({pointerType, x: 15, y: 14});
      expect(onTapUpdate).toHaveBeenCalledTimes(0);
      expect(onTapCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('onAuxiliaryTap', () => {
    let onAuxiliaryTap, ref;

    beforeEach(() => {
      onAuxiliaryTap = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useTap({onAuxiliaryTap});
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    });

    test('auxiliary-button pointer up', () => {
      const pointerType = 'mouse';
      const buttons = buttonsType.auxiliary;
      const target = createEventTarget(ref.current);
      target.pointerdown({buttons, pointerType});
      target.pointerup({pointerType});
      expect(onAuxiliaryTap).toHaveBeenCalledTimes(1);
    });

    test('modifier-button pointer up', () => {
      const pointerType = 'mouse';
      const buttons = buttonsType.primary;
      const target = createEventTarget(ref.current);
      target.pointerdown({buttons, pointerType});
      target.pointerup({metaKey: true, pointerType});
      expect(onAuxiliaryTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('onTapStart', () => {
    let onTapStart, ref;

    beforeEach(() => {
      onTapStart = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useTap({onTapStart});
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    });

    testWithPointerType('pointer down', pointerType => {
      const target = createEventTarget(ref.current);
      const nativeEvent = {
        buttons: buttonsType.primary,
        pageX: 10,
        pageY: 10,
        pointerType,
        x: 10,
        y: 10,
      };
      target.pointerdown(nativeEvent);
      // 'pointerup' is only for the MouseEvent/TouchEvent fallback
      // implementation. We also dispatch 'pointerup' so that this test covers
      // the case where browsers dispatch an emulated mousedown (and mouseup)
      // event *after* a touch ends.
      target.pointerup(nativeEvent);
      expect(onTapStart).toHaveBeenCalledTimes(1);
      expect(onTapStart).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          height: pointerType === 'mouse' ? 1 : 23,
          metaKey: false,
          pageX: 10,
          pageY: 10,
          pointerType,
          pressure: pointerType === 'touch' ? 1 : 0.5,
          screenX: 10,
          screenY: 60,
          shiftKey: false,
          tangentialPressure: 0,
          target: target.node,
          tiltX: 0,
          tiltY: 0,
          timeStamp: expect.any(Number),
          twist: 0,
          type: 'tap:start',
          width: pointerType === 'mouse' ? 1 : 23,
          x: 10,
          y: 10,
        }),
      );
    });

    test('second pointer down', () => {
      const pointerType = 'touch';
      const target = createEventTarget(ref.current);
      const buttons = buttonsType.primary;
      target.pointerdown({buttons, pointerId: 1, pointerType});
      expect(onTapStart).toHaveBeenCalledTimes(1);
      if (hasPointerEvents) {
        target.pointerdown({buttons, pointerId: 2, pointerType});
      } else {
        // TouchEvents
        target.pointerdown([
          {pointerId: 1, pointerType},
          {pointerId: 2, pointerType},
        ]);
      }
      expect(onTapStart).toHaveBeenCalledTimes(1);
    });

    testWithPointerType('ignored buttons and modifiers', pointerType => {
      const target = createEventTarget(ref.current);
      const {auxiliary, eraser, primary, secondary} = buttonsType;
      if (pointerType !== 'touch') {
        // right-click
        target.pointerdown({buttons: secondary, pointerType});
        target.pointerup();
        // middle-click
        target.pointerdown({buttons: auxiliary, pointerType});
        target.pointerup();
        // pen eraser
        target.pointerdown({buttons: eraser, pointerType});
        target.pointerup();
      }
      // alt-click
      target.pointerdown({buttons: primary, altKey: true, pointerType});
      target.pointerup();
      // ctrl-click
      target.pointerdown({buttons: primary, ctrlKey: true, pointerType});
      target.pointerup();
      // meta-click
      target.pointerdown({buttons: primary, metaKey: true, pointerType});
      target.pointerup();
      // shift-click
      target.pointerdown({buttons: primary, shiftKey: true, pointerType});
      target.pointerup();

      expect(onTapStart).toHaveBeenCalledTimes(0);
    });
  });

  describe('onTapEnd', () => {
    let onTapEnd, ref;

    beforeEach(() => {
      onTapEnd = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useTap({onTapEnd});
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    });

    testWithPointerType('pointer up', pointerType => {
      const target = createEventTarget(ref.current);
      target.pointerdown({buttons: buttonsType.primary, pointerType});
      target.pointerup({
        pageX: 10,
        pageY: 10,
        pointerType,
        x: 10,
        y: 10,
      });
      expect(onTapEnd).toHaveBeenCalledTimes(1);
      expect(onTapEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          height: pointerType === 'mouse' ? 1 : 23,
          metaKey: false,
          pageX: 10,
          pageY: 10,
          pointerType,
          pressure: 0,
          screenX: 10,
          screenY: 60,
          shiftKey: false,
          tangentialPressure: 0,
          target: target.node,
          tiltX: 0,
          tiltY: 0,
          timeStamp: expect.any(Number),
          twist: 0,
          type: 'tap:end',
          width: pointerType === 'mouse' ? 1 : 23,
          x: 10,
          y: 10,
        }),
      );
    });

    testWithPointerType('zero-dimension hit rect', pointerType => {
      const targetRef = React.createRef();
      const innerRef = React.createRef();

      const Component = () => {
        const listener = useTap({onTapEnd});
        return (
          <div ref={targetRef} listeners={listener}>
            <button ref={innerRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => innerRef.current;

      const target = createEventTarget(targetRef.current);
      target.setBoundingClientRect({x: 0, y: 0, width: 0, height: 0});
      const innerTarget = createEventTarget(innerRef.current);
      innerTarget.pointerdown({pointerType});
      innerTarget.pointerup({pointerType});
      expect(onTapEnd).toBeCalled();
    });

    testWithPointerType('pointer up outside target', pointerType => {
      const downTarget = createEventTarget(ref.current);
      const upTarget = createEventTarget(container);
      tapAndReleaseOutside({
        hasPointerEvents,
        downTarget,
        upTarget,
        pointerType,
      });
      expect(onTapEnd).not.toBeCalled();
    });

    test('ignored buttons and modifiers', () => {
      const target = createEventTarget(ref.current);
      const primary = buttonsType.primary;
      // right-click
      target.pointerdown({buttons: buttonsType.secondary});
      target.pointerup();
      // middle-click
      target.pointerdown({buttons: buttonsType.auxiliary});
      target.pointerup();
      // pen eraser
      target.pointerdown({buttons: buttonsType.eraser});
      target.pointerup();
      // alt-click
      target.pointerdown({buttons: primary});
      target.pointerup({altKey: true});
      // ctrl-click
      target.pointerdown({buttons: primary});
      target.pointerup({ctrlKey: true});
      // meta-click
      target.pointerdown({buttons: primary});
      target.pointerup({metaKey: true});
      // shift-click
      target.pointerdown({buttons: primary});
      target.pointerup({shiftKey: true});

      expect(onTapEnd).toHaveBeenCalledTimes(0);
    });
  });

  describe('onTapUpdate', () => {
    let onTapUpdate, ref;
    const rect = {x: 0, y: 0, width: 100, height: 100};
    const coordinates = {x: 10, y: 10};

    beforeEach(() => {
      onTapUpdate = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useTap({onTapUpdate});
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    });

    testWithPointerType('requires activation', pointerType => {
      const target = createEventTarget(ref.current);
      target.setBoundingClientRect(rect);
      target.pointerhover({pointerType, ...coordinates});
      target.pointermove({pointerType, ...coordinates});
      expect(onTapUpdate).not.toBeCalled();
    });

    testWithPointerType('pointer move', pointerType => {
      const target = createEventTarget(ref.current);
      target.setBoundingClientRect(rect);
      target.pointerdown({pointerType});

      target.pointermove({pointerType, x: 10, y: 10});
      expect(onTapUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          height: pointerType === 'mouse' ? 1 : 23,
          metaKey: false,
          pageX: 10,
          pageY: 10,
          pointerType,
          pressure: pointerType === 'touch' ? 1 : 0.5,
          screenX: 10,
          screenY: 60,
          shiftKey: false,
          tangentialPressure: 0,
          target: target.node,
          tiltX: 0,
          tiltY: 0,
          timeStamp: expect.any(Number),
          twist: 0,
          type: 'tap:update',
          width: pointerType === 'mouse' ? 1 : 23,
          x: 10,
          y: 10,
        }),
      );

      target.pointermove({pointerType, x: 20, y: 20});
      expect(onTapUpdate).toHaveBeenCalledWith(
        expect.objectContaining({pointerType, x: 20, y: 20}),
      );

      expect(onTapUpdate).toHaveBeenCalledTimes(2);
    });

    testWithPointerType('pointer moves outside target', pointerType => {
      const target = createEventTarget(ref.current);
      const containerTarget = createEventTarget(container);
      target.setBoundingClientRect(rect);
      target.pointerdown({pointerType});
      target.pointermove({pointerType, x: 10, y: 10});
      expect(onTapUpdate).toHaveBeenCalledTimes(1);

      // NOTE: this assumes the PointerEvent implementation calls
      // 'releasePointerCapture' for touch pointers
      if (!hasPointerEvents && pointerType === 'touch') {
        document.elementFromPoint = () => containerTarget.node;
        target.pointermove({pointerType, x: 101, y: 101});
      } else {
        containerTarget.pointermove({pointerType, x: 101, y: 101});
      }

      // No extra 'onTapUpdate' calls when the pointer is outside the target
      expect(onTapUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('onTapChange', () => {
    let eventsLog, onTapChange, ref;

    const logger = msg => () => {
      eventsLog.push(msg);
    };

    beforeEach(() => {
      eventsLog = [];
      onTapChange = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useTap({
          onTapChange(e) {
            logger('change')();
            onTapChange(e);
          },
          onTapStart: logger('start'),
          onTapEnd: logger('end'),
          onTapCancel: logger('cancel'),
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    });

    testWithPointerType('pointer down/up', pointerType => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType});
      expect(onTapChange).toHaveBeenCalledTimes(1);
      expect(onTapChange).toHaveBeenCalledWith(true);
      target.pointerup({pointerType, x: 0, y: 0});
      expect(onTapChange).toHaveBeenCalledTimes(2);
      expect(onTapChange).toHaveBeenCalledWith(false);
      expect(eventsLog).toEqual(['start', 'change', 'change', 'end']);
    });

    testWithPointerType('pointer cancel', pointerType => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType});
      expect(onTapChange).toHaveBeenCalledTimes(1);
      expect(onTapChange).toHaveBeenCalledWith(true);
      target.pointercancel({pointerType});
      expect(onTapChange).toHaveBeenCalledTimes(2);
      expect(onTapChange).toHaveBeenCalledWith(false);
      expect(eventsLog).toEqual(['start', 'change', 'change', 'cancel']);
    });

    testWithPointerType('pointer move outside target', pointerType => {
      const downTarget = createEventTarget(ref.current);
      const upTarget = createEventTarget(container);
      tapAndMoveOutside({
        hasPointerEvents,
        downTarget,
        upTarget,
        pointerType,
      });
      expect(onTapChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('onTapCancel', () => {
    let onTapCancel, onTapUpdate, parentRef, ref, siblingRef;

    beforeEach(() => {
      onTapCancel = jest.fn();
      onTapUpdate = jest.fn();
      parentRef = React.createRef();
      ref = React.createRef();
      siblingRef = React.createRef();
      const Component = () => {
        const listener = useTap({onTapCancel, onTapUpdate});
        return (
          <div ref={parentRef}>
            <div ref={ref} listeners={listener} />
            <span ref={siblingRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
    });

    testWithPointerType('pointer cancel', pointerType => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType});
      target.pointercancel({pointerType});
      expect(onTapCancel).toHaveBeenCalledTimes(1);
      expect(onTapCancel).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          height: 1,
          metaKey: false,
          pageX: 0,
          pageY: 0,
          pointerType,
          pressure: 0,
          screenX: 0,
          screenY: 0,
          shiftKey: false,
          tangentialPressure: 0,
          target: target.node,
          tiltX: 0,
          tiltY: 0,
          timeStamp: expect.any(Number),
          twist: 0,
          type: 'tap:cancel',
          width: 1,
          x: 0,
          y: 0,
        }),
      );
      target.pointermove({pointerType, x: 5, y: 5});
      expect(onTapUpdate).not.toBeCalled();
    });

    testWithPointerType('pointer move outside target', pointerType => {
      const downTarget = createEventTarget(ref.current);
      const upTarget = createEventTarget(container);
      tapAndMoveOutside({
        hasPointerEvents,
        downTarget,
        upTarget,
        pointerType,
      });
      expect(onTapCancel).toBeCalled();
    });

    test('ignored modifiers', () => {
      const target = createEventTarget(ref.current);
      const primary = buttonsType.primary;
      // alt-click
      target.pointerdown({buttons: primary});
      target.pointerup({altKey: true});
      // ctrl-click
      target.pointerdown({buttons: primary});
      target.pointerup({ctrlKey: true});
      // meta-click
      target.pointerdown({buttons: primary});
      target.pointerup({metaKey: true});
      // shift-click
      target.pointerdown({buttons: primary});
      target.pointerup({shiftKey: true});

      expect(onTapCancel).toHaveBeenCalledTimes(4);
    });

    test('long press context menu', () => {
      const target = createEventTarget(ref.current);
      target.contextmenu({}, {pointerType: 'touch'});
      expect(onTapCancel).toHaveBeenCalledTimes(1);
    });

    test('parent scroll (non-mouse)', () => {
      const target = createEventTarget(ref.current);
      const parentTarget = createEventTarget(parentRef.current);
      target.pointerdown({pointerType: 'touch'});
      parentTarget.scroll();
      expect(onTapCancel).toHaveBeenCalledTimes(1);
    });

    test('sibling scroll', () => {
      const target = createEventTarget(ref.current);
      const siblingTarget = createEventTarget(siblingRef.current);
      target.pointerdown();
      siblingTarget.scroll();
      expect(onTapCancel).not.toBeCalled();
    });

    test('document scroll (non-mouse)', () => {
      const target = createEventTarget(ref.current);
      const documentTarget = createEventTarget(document);
      target.pointerdown({pointerType: 'touch'});
      documentTarget.scroll();
      expect(onTapCancel).toHaveBeenCalledTimes(1);
    });

    // Scroll on an element not managed by React
    test('root container scroll (non-mouse)', () => {
      const target = createEventTarget(ref.current);
      const containerTarget = createEventTarget(container);
      target.pointerdown({pointerType: 'touch'});
      containerTarget.scroll();
      expect(onTapCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('preventDefault', () => {
    let onTapEnd, ref, innerRef, preventDefault, remount;

    beforeEach(() => {
      remount = function(shouldPreventDefault) {
        onTapEnd = jest.fn();
        preventDefault = jest.fn();
        ref = React.createRef();
        innerRef = React.createRef();
        const Component = () => {
          const listener = useTap({
            onTapEnd,
            preventDefault: shouldPreventDefault,
          });
          return (
            <a href="#" ref={ref} listeners={listener}>
              <div ref={innerRef} />
            </a>
          );
        };
        ReactDOM.render(<Component />, container);
      };
      remount();
    });

    test('prevents native behavior by default', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup({preventDefault});
      expect(preventDefault).toBeCalled();
      expect(onTapEnd).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    test('prevents native behaviour by default (inner target)', () => {
      const innerTarget = createEventTarget(innerRef.current);
      innerTarget.pointerdown();
      innerTarget.pointerup({preventDefault});
      expect(preventDefault).toBeCalled();
      expect(onTapEnd).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    test('allows native behaviour if false', () => {
      remount(false);

      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup({preventDefault});
      expect(preventDefault).not.toBeCalled();
      expect(onTapEnd).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: false}),
      );
    });
  });
});
