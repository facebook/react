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
  buttonType,
  buttonsType,
  createEventTarget,
  resetActivePointers,
  setPointerEvent,
} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let PressResponder;
let usePress;

function initializeModules(hasPointerEvents) {
  jest.resetModules();
  setPointerEvent(hasPointerEvents);
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableDeprecatedFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');

  // TODO: This import throws outside of experimental mode. Figure out better
  // strategy for gated imports.
  if (__EXPERIMENTAL__) {
    PressResponder = require('react-interactions/events/press-legacy')
      .PressResponder;
    usePress = require('react-interactions/events/press-legacy').usePress;
  }
}

function removePressMoveStrings(eventString) {
  if (eventString === 'onPressMove') {
    return false;
  }
  return true;
}

const forcePointerEvents = true;
const environmentTable = [[forcePointerEvents], [!forcePointerEvents]];

const pointerTypesTable = [['mouse'], ['touch']];

describe.each(environmentTable)('Press responder', hasPointerEvents => {
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
    resetActivePointers();
  });

  describe('disabled', () => {
    let onPressStart, onPress, onPressEnd, ref;

    const componentInit = () => {
      onPressStart = jest.fn();
      onPress = jest.fn();
      onPressEnd = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = usePress({
          disabled: true,
          onPressStart,
          onPress,
          onPressEnd,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    };

    // @gate experimental
    it('does not call callbacks', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup();
      expect(onPressStart).not.toBeCalled();
      expect(onPress).not.toBeCalled();
      expect(onPressEnd).not.toBeCalled();
    });
  });

  describe('onPressStart', () => {
    let onPressStart, ref;

    const componentInit = () => {
      onPressStart = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = usePress({
          onPressStart,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    };

    // @gate experimental
    it('is called after pointer down: mouse', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'mouse'});
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressstart'}),
      );
    });

    // @gate experimental
    it('is called after pointer down: touch', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressstart'}),
      );
    });

    // @gate experimental
    it('is called after middle-button pointer down', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: buttonsType.auxiliary,
        pointerType: 'mouse',
      });
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({
          buttons: buttonsType.auxiliary,
          pointerType: 'mouse',
          type: 'pressstart',
        }),
      );
    });

    // @gate experimental
    it('is not called after pointer move following middle-button press', () => {
      componentInit();
      const node = ref.current;
      const target = createEventTarget(node);
      target.setBoundingClientRect({x: 0, y: 0, width: 100, height: 100});
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: buttonsType.auxiliary,
        pointerType: 'mouse',
      });
      target.pointerup({pointerType: 'mouse'});
      target.pointerhover({x: 110, y: 110});
      target.pointerhover({x: 50, y: 50});
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    // @gate experimental
    it('ignores any events not caused by primary/middle-click or touch/pen contact', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({buttons: buttonsType.secondary});
      target.pointerup({buttons: buttonsType.secondary});
      target.pointerdown({buttons: buttonsType.eraser});
      target.pointerup({buttons: buttonsType.eraser});
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    // @gate experimental
    it('is called once after "keydown" events for Enter', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keydown({key: 'Enter'});
      target.keydown({key: 'Enter'});
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    // @gate experimental
    it('is called once after "keydown" events for Spacebar', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const preventDefault = jest.fn();
      target.keydown({key: ' ', preventDefault});
      expect(preventDefault).toBeCalled();
      target.keydown({key: ' ', preventDefault});
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
          type: 'pressstart',
        }),
      );
    });

    // @gate experimental
    it('is not called after "keydown" for other keys', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'a'});
      expect(onPressStart).not.toBeCalled();
    });
  });

  describe('onPressEnd', () => {
    let onPressEnd, ref;

    const componentInit = () => {
      onPressEnd = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = usePress({
          onPressEnd,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    };

    // @gate experimental
    it('is called after pointer up: mouse', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'mouse'});
      target.pointerup({pointerType: 'mouse'});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressend'}),
      );
    });

    // @gate experimental
    it('is called after pointer up: touch', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.pointerup({pointerType: 'touch'});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });

    // @gate experimental
    it('is called after middle-button pointer up', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({
        buttons: buttonsType.auxiliary,
        pointerType: 'mouse',
      });
      target.pointerup({pointerType: 'mouse'});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          buttons: buttonsType.auxiliary,
          pointerType: 'mouse',
          type: 'pressend',
        }),
      );
    });

    // @gate experimental
    it('is called after "keyup" event for Enter', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      // click occurs before keyup
      target.click();
      target.keyup({key: 'Enter'});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    // @gate experimental
    it('is called after "keyup" event for Spacebar', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: ' '});
      target.keyup({key: ' '});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    // @gate experimental
    it('is not called after "keyup" event for other keys', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'a'});
      expect(onPressEnd).not.toBeCalled();
    });

    // @gate experimental
    it('is called with keyboard modifiers', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({
        key: 'Enter',
        metaKey: true,
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
      });
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
          type: 'pressend',
          metaKey: true,
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
        }),
      );
    });
  });

  describe('onPressChange', () => {
    let onPressChange, ref;

    const componentInit = () => {
      onPressChange = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = usePress({
          onPressChange,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    };

    // @gate experimental
    it('is called after pointer down and up: mouse', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'mouse'});
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      target.pointerup({pointerType: 'mouse'});
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is called after pointer down and up: touch', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      target.pointerup({pointerType: 'touch'});
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is called after valid "keydown" and "keyup" events', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      target.keyup({key: 'Enter'});
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onPress', () => {
    let onPress, ref;

    const componentInit = () => {
      onPress = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = usePress({
          onPress,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      document.elementFromPoint = () => ref.current;
    };

    // @gate experimental
    it('is called after pointer up: mouse', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'mouse'});
      target.pointerup({pointerType: 'mouse', x: 10, y: 10});
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'press'}),
      );
    });

    // @gate experimental
    it('is called after pointer up: touch', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.pointerup({pointerType: 'touch', x: 10, y: 10});
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'press'}),
      );
    });

    // @gate experimental
    it('is not called after middle-button press', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({
        buttons: buttonsType.auxiliary,
        pointerType: 'mouse',
      });
      target.pointerup({pointerType: 'mouse'});
      expect(onPress).not.toHaveBeenCalled();
    });

    // @gate experimental
    it('is not called after virtual middle-button press', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: 0,
        pointerType: 'mouse',
      });
      target.pointerup({pointerType: 'mouse'});
      expect(onPress).not.toHaveBeenCalled();
    });

    // @gate experimental
    it('is called after valid "keyup" event', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'Enter'});
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'press'}),
      );
    });

    // @gate experimental
    it('is not called after invalid "keyup" event', () => {
      componentInit();
      const inputRef = React.createRef();
      const Component = () => {
        const listener = usePress({onPress});
        return <input ref={inputRef} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      const target = createEventTarget(inputRef.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'Enter'});
      target.keydown({key: ' '});
      target.keyup({key: ' '});
      expect(onPress).not.toBeCalled();
    });

    // @gate experimental
    it('is called with modifier keys', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({metaKey: true, pointerType: 'mouse'});
      target.pointerup({metaKey: true, pointerType: 'mouse'});
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'mouse',
          type: 'press',
          metaKey: true,
        }),
      );
    });

    // @gate experimental
    it('is called if target rect is not right but the target is (for mouse events)', () => {
      componentInit();
      const buttonRef = React.createRef();
      const divRef = React.createRef();

      const Component = () => {
        const listener = usePress({onPress});
        return (
          <div ref={divRef} DEPRECATED_flareListeners={listener}>
            <button ref={buttonRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(divRef.current);
      target.setBoundingClientRect({x: 0, y: 0, width: 0, height: 0});
      const innerTarget = createEventTarget(buttonRef.current);
      innerTarget.pointerdown({pointerType: 'mouse'});
      innerTarget.pointerup({pointerType: 'mouse'});
      expect(onPress).toBeCalled();
    });

    // @gate experimental
    it('is called once after virtual screen reader "click" event', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const preventDefault = jest.fn();
      target.virtualclick({preventDefault});
      expect(preventDefault).toBeCalled();
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
          type: 'press',
        }),
      );
    });
  });

  describe('onPressMove', () => {
    let onPressMove, ref;

    const componentInit = () => {
      onPressMove = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = usePress({
          onPressMove,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      document.elementFromPoint = () => ref.current;
    };

    // @gate experimental
    it('is called after pointer move: mouse', () => {
      componentInit();
      const node = ref.current;
      const target = createEventTarget(node);
      target.setBoundingClientRect({x: 0, y: 0, width: 100, height: 100});
      target.pointerdown({pointerType: 'mouse'});
      target.pointermove({pointerType: 'mouse', x: 10, y: 10});
      target.pointermove({pointerType: 'mouse', x: 20, y: 20});
      expect(onPressMove).toHaveBeenCalledTimes(2);
      expect(onPressMove).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressmove'}),
      );
    });

    // @gate experimental
    it('is called after pointer move: touch', () => {
      componentInit();
      const node = ref.current;
      const target = createEventTarget(node);
      target.setBoundingClientRect({x: 0, y: 0, width: 100, height: 100});
      target.pointerdown({pointerType: 'touch'});
      target.pointermove({pointerType: 'touch', x: 10, y: 10});
      target.pointermove({pointerType: 'touch', x: 20, y: 20});
      expect(onPressMove).toHaveBeenCalledTimes(2);
      expect(onPressMove).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressmove'}),
      );
    });

    // @gate experimental
    it('is not called if pointer move occurs during keyboard press', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.setBoundingClientRect({x: 0, y: 0, width: 100, height: 100});
      target.keydown({key: 'Enter'});
      target.pointermove({
        buttons: buttonsType.none,
        pointerType: 'mouse',
        x: 10,
        y: 10,
      });
      expect(onPressMove).not.toBeCalled();
    });
  });

  describe.each(pointerTypesTable)('press with movement: %s', pointerType => {
    let events, ref, outerRef;

    const componentInit = () => {
      events = [];
      ref = React.createRef();
      outerRef = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };
      const Component = () => {
        const listener = usePress({
          onPress: createEventHandler('onPress'),
          onPressChange: createEventHandler('onPressChange'),
          onPressMove: createEventHandler('onPressMove'),
          onPressStart: createEventHandler('onPressStart'),
          onPressEnd: createEventHandler('onPressEnd'),
        });
        return (
          <div ref={outerRef}>
            <div ref={ref} DEPRECATED_flareListeners={listener} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);
      document.elementFromPoint = () => ref.current;
    };

    const rectMock = {width: 100, height: 100, x: 50, y: 50};
    const pressRectOffset = 20;
    const coordinatesInside = {
      x: rectMock.x - pressRectOffset,
      y: rectMock.y - pressRectOffset,
    };
    const coordinatesOutside = {
      x: rectMock.x - pressRectOffset - 1,
      y: rectMock.y - pressRectOffset - 1,
    };

    describe('within bounds of hit rect', () => {
      /** ┌──────────────────┐
       *  │  ┌────────────┐  │
       *  │  │ VisualRect │  │
       *  │  └────────────┘  │
       *  │     HitRect    X │ <= Move to X and release
       *  └──────────────────┘
       */
      // @gate experimental
      it('"onPress*" events are called immediately', () => {
        componentInit();
        const target = createEventTarget(ref.current);
        target.setBoundingClientRect(rectMock);
        target.pointerdown({pointerType});
        target.pointermove({pointerType, ...coordinatesInside});
        target.pointerup({pointerType, ...coordinatesInside});
        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      // @gate experimental
      it('"onPress*" events are correctly called with target change', () => {
        componentInit();
        const target = createEventTarget(ref.current);
        const outerTarget = createEventTarget(outerRef.current);
        target.setBoundingClientRect(rectMock);
        target.pointerdown({pointerType});
        target.pointermove({pointerType, ...coordinatesInside});
        // TODO: this sequence may differ in the future between PointerEvent and mouse fallback when
        // use 'setPointerCapture'.
        if (pointerType === 'touch') {
          target.pointermove({pointerType, ...coordinatesOutside});
        } else {
          outerTarget.pointermove({pointerType, ...coordinatesOutside});
        }
        target.pointermove({pointerType, ...coordinatesInside});
        target.pointerup({pointerType, ...coordinatesInside});

        expect(events.filter(removePressMoveStrings)).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressEnd',
          'onPressChange',
          'onPressStart',
          'onPressChange',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      // @gate experimental
      it('press retention offset can be configured', () => {
        componentInit();
        const localEvents = [];
        const localRef = React.createRef();
        const createEventHandler = msg => () => {
          localEvents.push(msg);
        };
        const pressRetentionOffset = {top: 40, bottom: 40, left: 40, right: 40};

        const Component = () => {
          const listener = usePress({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
            pressRetentionOffset,
          });
          return <div ref={localRef} DEPRECATED_flareListeners={listener} />;
        };
        ReactDOM.render(<Component />, container);

        const target = createEventTarget(localRef.current);
        target.setBoundingClientRect(rectMock);
        target.pointerdown({pointerType});
        target.pointermove({
          pointerType,
          x: rectMock.x,
          y: rectMock.y,
        });
        target.pointerup({pointerType, ...coordinatesInside});
        expect(localEvents).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      // @gate experimental
      it('responder region accounts for decrease in element dimensions', () => {
        componentInit();
        const target = createEventTarget(ref.current);
        target.setBoundingClientRect(rectMock);
        target.pointerdown({pointerType});
        // emulate smaller dimensions change on activation
        target.setBoundingClientRect({width: 80, height: 80, y: 60, x: 60});
        const coordinates = {x: rectMock.x, y: rectMock.y};
        // move to an area within the pre-activation region
        target.pointermove({pointerType, ...coordinates});
        target.pointerup({pointerType, ...coordinates});
        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      // @gate experimental
      it('responder region accounts for increase in element dimensions', () => {
        componentInit();
        const target = createEventTarget(ref.current);
        target.setBoundingClientRect(rectMock);
        target.pointerdown({pointerType});
        // emulate larger dimensions change on activation
        target.setBoundingClientRect({width: 200, height: 200, y: 0, x: 0});
        const coordinates = {x: rectMock.x - 50, y: rectMock.y - 50};
        // move to an area within the post-activation region
        target.pointermove({pointerType, ...coordinates});
        target.pointerup({pointerType, ...coordinates});
        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });
    });

    describe('beyond bounds of hit rect', () => {
      /** ┌──────────────────┐
       *  │  ┌────────────┐  │
       *  │  │ VisualRect │  │
       *  │  └────────────┘  │
       *  │     HitRect      │
       *  └──────────────────┘
       *                   X   <= Move to X and release
       */
      // @gate experimental
      it('"onPress" is not called on release', () => {
        componentInit();
        const target = createEventTarget(ref.current);
        const targetContainer = createEventTarget(container);
        target.setBoundingClientRect(rectMock);
        target.pointerdown({pointerType});
        target.pointermove({pointerType, ...coordinatesInside});
        if (pointerType === 'mouse') {
          // TODO: use setPointerCapture so this is only true for fallback mouse events.
          targetContainer.pointermove({pointerType, ...coordinatesOutside});
          targetContainer.pointerup({pointerType, ...coordinatesOutside});
        } else {
          target.pointermove({pointerType, ...coordinatesOutside});
          target.pointerup({pointerType, ...coordinatesOutside});
        }
        expect(events.filter(removePressMoveStrings)).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressEnd',
          'onPressChange',
        ]);
      });
    });

    // @gate experimental
    it('"onPress" is called on re-entry to hit rect', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const targetContainer = createEventTarget(container);
      target.setBoundingClientRect(rectMock);
      target.pointerdown({pointerType});
      target.pointermove({pointerType, ...coordinatesInside});
      if (pointerType === 'mouse') {
        // TODO: use setPointerCapture so this is only true for fallback mouse events.
        targetContainer.pointermove({pointerType, ...coordinatesOutside});
      } else {
        target.pointermove({pointerType, ...coordinatesOutside});
      }
      target.pointermove({pointerType, ...coordinatesInside});
      target.pointerup({pointerType, ...coordinatesInside});

      expect(events).toEqual([
        'onPressStart',
        'onPressChange',
        'onPressMove',
        'onPressEnd',
        'onPressChange',
        'onPressStart',
        'onPressChange',
        'onPressEnd',
        'onPressChange',
        'onPress',
      ]);
    });
  });

  describe('nested responders', () => {
    if (hasPointerEvents) {
      // @gate experimental
      it('dispatch events in the correct order', () => {
        const events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const Inner = () => {
          const listener = usePress({
            onPress: createEventHandler('inner: onPress'),
            onPressChange: createEventHandler('inner: onPressChange'),
            onPressMove: createEventHandler('inner: onPressMove'),
            onPressStart: createEventHandler('inner: onPressStart'),
            onPressEnd: createEventHandler('inner: onPressEnd'),
          });
          return (
            <div
              ref={ref}
              DEPRECATED_flareListeners={listener}
              onPointerDown={createEventHandler('pointerdown')}
              onPointerUp={createEventHandler('pointerup')}
              onKeyDown={createEventHandler('keydown')}
              onKeyUp={createEventHandler('keyup')}
            />
          );
        };

        const Outer = () => {
          const listener = usePress({
            onPress: createEventHandler('outer: onPress'),
            onPressChange: createEventHandler('outer: onPressChange'),
            onPressMove: createEventHandler('outer: onPressMove'),
            onPressStart: createEventHandler('outer: onPressStart'),
            onPressEnd: createEventHandler('outer: onPressEnd'),
          });
          return (
            <div DEPRECATED_flareListeners={listener}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

        const target = createEventTarget(ref.current);
        target.setBoundingClientRect({x: 0, y: 0, width: 100, height: 100});
        target.pointerdown();
        target.pointerup();
        expect(events).toEqual([
          'inner: onPressStart',
          'inner: onPressChange',
          'pointerdown',
          'inner: onPressEnd',
          'inner: onPressChange',
          'inner: onPress',
          'pointerup',
        ]);
      });
    }

    describe('correctly not propagate', () => {
      // @gate experimental
      it('for onPress', () => {
        const ref = React.createRef();
        const onPress = jest.fn();

        const Inner = () => {
          const listener = usePress({onPress});
          return <div ref={ref} DEPRECATED_flareListeners={listener} />;
        };

        const Outer = () => {
          const listener = usePress({onPress});
          return (
            <div DEPRECATED_flareListeners={listener}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

        const target = createEventTarget(ref.current);
        target.setBoundingClientRect({x: 0, y: 0, width: 100, height: 100});
        target.pointerdown();
        target.pointerup();
        expect(onPress).toHaveBeenCalledTimes(1);
      });

      // @gate experimental
      it('for onPressStart/onPressEnd', () => {
        const ref = React.createRef();
        const onPressStart = jest.fn();
        const onPressEnd = jest.fn();

        const Inner = () => {
          const listener = usePress({onPressStart, onPressEnd});
          return <div ref={ref} DEPRECATED_flareListeners={listener} />;
        };

        const Outer = () => {
          const listener = usePress({onPressStart, onPressEnd});
          return (
            <div DEPRECATED_flareListeners={listener}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

        const target = createEventTarget(ref.current);
        target.pointerdown();
        expect(onPressStart).toHaveBeenCalledTimes(1);
        expect(onPressEnd).toHaveBeenCalledTimes(0);
        target.pointerup();
        expect(onPressStart).toHaveBeenCalledTimes(1);
        expect(onPressEnd).toHaveBeenCalledTimes(1);
      });

      // @gate experimental
      it('for onPressChange', () => {
        const ref = React.createRef();
        const onPressChange = jest.fn();

        const Inner = () => {
          const listener = usePress({onPressChange});
          return <div ref={ref} DEPRECATED_flareListeners={listener} />;
        };

        const Outer = () => {
          const listener = usePress({onPressChange});
          return (
            <div DEPRECATED_flareListeners={listener}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

        const target = createEventTarget(ref.current);
        target.pointerdown();
        expect(onPressChange).toHaveBeenCalledTimes(1);
        target.pointerup();
        expect(onPressChange).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('link components', () => {
    // @gate experimental
    it('prevents native behavior by default', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPress});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup({preventDefault});
      expect(preventDefault).toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    // @gate experimental
    it('prevents native behaviour for keyboard events by default', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPress});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'Enter'});
      target.click({preventDefault});
      expect(preventDefault).toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    // @gate experimental
    it('deeply prevents native behaviour by default', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const buttonRef = React.createRef();

      const Component = () => {
        const listener = usePress({onPress});
        return (
          <a href="#">
            <button ref={buttonRef} DEPRECATED_flareListeners={listener} />
          </a>
        );
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(buttonRef.current);
      target.pointerdown();
      target.pointerup({preventDefault});
      expect(preventDefault).toBeCalled();
    });

    // @gate experimental
    it('prevents native behaviour by default with nested elements', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPress});
        return (
          <a href="#" DEPRECATED_flareListeners={listener}>
            <div ref={ref} />
          </a>
        );
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup({preventDefault});
      expect(preventDefault).toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    // @gate experimental
    it('uses native behaviour for interactions with modifier keys', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPress});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      ['metaKey', 'ctrlKey', 'shiftKey'].forEach(modifierKey => {
        const target = createEventTarget(ref.current);
        target.pointerdown({[modifierKey]: true});
        target.pointerup({[modifierKey]: true, preventDefault});
        expect(preventDefault).not.toBeCalled();
        expect(onPress).toHaveBeenCalledWith(
          expect.objectContaining({defaultPrevented: false}),
        );
      });
    });

    // @gate experimental
    it('uses native behaviour for pointer events if preventDefault is false', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPress, preventDefault: false});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup({preventDefault});
      expect(preventDefault).not.toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: false}),
      );
    });

    // @gate experimental
    it('uses native behaviour for keyboard events if preventDefault is false', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPress, preventDefault: false});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.click({preventDefault});
      target.keyup({key: 'Enter'});
      expect(preventDefault).not.toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: false}),
      );
    });
  });

  describe('responder cancellation', () => {
    // @gate experimental
    it('ends on pointer cancel: mouse', () => {
      const onPressEnd = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPressEnd});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'mouse'});
      target.pointercancel({pointerType: 'mouse'});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });

    // @gate experimental
    it('ends on pointer cancel: touch', () => {
      const onPressEnd = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPressEnd});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.pointercancel({pointerType: 'touch'});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });
  });

  // @gate experimental
  it('does end on "scroll" to document (not mouse)', () => {
    const onPressEnd = jest.fn();
    const ref = React.createRef();

    const Component = () => {
      const listener = usePress({onPressEnd});
      return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
    };
    ReactDOM.render(<Component />, container);

    const target = createEventTarget(ref.current);
    const targetDocument = createEventTarget(document);
    target.pointerdown({pointerType: 'touch'});
    targetDocument.scroll();
    expect(onPressEnd).toHaveBeenCalledTimes(1);
  });

  // @gate experimental
  it('does end on "scroll" to a parent container (not mouse)', () => {
    const onPressEnd = jest.fn();
    const ref = React.createRef();
    const containerRef = React.createRef();

    const Component = () => {
      const listener = usePress({onPressEnd});
      return (
        <div ref={containerRef}>
          <a ref={ref} DEPRECATED_flareListeners={listener} />
        </div>
      );
    };
    ReactDOM.render(<Component />, container);

    const target = createEventTarget(ref.current);
    const targetContainer = createEventTarget(containerRef.current);
    target.pointerdown({pointerType: 'touch'});
    targetContainer.scroll();
    expect(onPressEnd).toHaveBeenCalledTimes(1);
  });

  // @gate experimental
  it('does not end on "scroll" to an element outside', () => {
    const onPressEnd = jest.fn();
    const ref = React.createRef();
    const outsideRef = React.createRef();

    const Component = () => {
      const listener = usePress({onPressEnd});
      return (
        <div>
          <a ref={ref} DEPRECATED_flareListeners={listener} />
          <span ref={outsideRef} />
        </div>
      );
    };
    ReactDOM.render(<Component />, container);

    const target = createEventTarget(ref.current);
    const targetOutside = createEventTarget(outsideRef.current);
    target.pointerdown();
    targetOutside.scroll();
    expect(onPressEnd).not.toBeCalled();
  });

  // @gate experimental
  it('expect displayName to show up for event component', () => {
    expect(PressResponder.displayName).toBe('Press');
  });

  // @gate experimental
  it('should not trigger an invariant in addRootEventTypes()', () => {
    const ref = React.createRef();

    const Component = () => {
      const listener = usePress();
      return <button ref={ref} DEPRECATED_flareListeners={listener} />;
    };
    ReactDOM.render(<Component />, container);

    const target = createEventTarget(ref.current);
    target.pointerdown();
    target.pointermove();
    target.pointerup();
    target.pointerdown();
  });

  // @gate experimental
  it('event.preventDefault works as expected', () => {
    const onPress = jest.fn(e => e.preventDefault());
    const onPressStart = jest.fn(e => e.preventDefault());
    const onPressEnd = jest.fn(e => e.preventDefault());
    const preventDefault = jest.fn();
    const buttonRef = React.createRef();

    const Component = () => {
      const listener = usePress({onPress, onPressStart, onPressEnd});
      return <button ref={buttonRef} DEPRECATED_flareListeners={listener} />;
    };
    ReactDOM.render(<Component />, container);

    const target = createEventTarget(buttonRef.current);
    target.pointerdown();
    target.pointerup({preventDefault});
    expect(preventDefault).toBeCalled();
    expect(onPressStart).toBeCalled();
    expect(onPressEnd).toBeCalled();
  });

  // @gate experimental
  it('when blur occurs on a pressed target, we should disengage press', () => {
    const onPress = jest.fn();
    const onPressStart = jest.fn();
    const onPressEnd = jest.fn();
    const buttonRef = React.createRef();

    const Component = () => {
      const listener = usePress({onPress, onPressStart, onPressEnd});
      return <button ref={buttonRef} DEPRECATED_flareListeners={listener} />;
    };
    ReactDOM.render(<Component />, container);

    const target = createEventTarget(buttonRef.current);
    target.pointerdown();
    expect(onPressStart).toBeCalled();
    target.blur();
    expect(onPressEnd).toBeCalled();
    target.pointerup();
    expect(onPress).not.toBeCalled();
  });
});
