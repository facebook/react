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
  describeWithPointerEvent,
  resetActivePointers,
  setPointerEvent,
} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
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
    usePress = require('react-interactions/events/press').usePress;
  }
}

describeWithPointerEvent('Press responder', hasPointerEvents => {
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
    let onPressStart, onPressChange, onPressMove, onPressEnd, onPress, ref;

    const componentInit = () => {
      onPressStart = jest.fn();
      onPressChange = jest.fn();
      onPressMove = jest.fn();
      onPressEnd = jest.fn();
      onPress = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = usePress({
          disabled: true,
          onPressStart,
          onPressChange,
          onPressMove,
          onPressEnd,
          onPress,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    };

    // @gate experimental
    test('does not call callbacks for pointers', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup();
      expect(onPressStart).not.toBeCalled();
      expect(onPressChange).not.toBeCalled();
      expect(onPressMove).not.toBeCalled();
      expect(onPressEnd).not.toBeCalled();
      expect(onPress).not.toBeCalled();
    });

    // @gate experimental
    test('does not call callbacks for keyboard', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'Enter'});
      expect(onPressStart).not.toBeCalled();
      expect(onPressChange).not.toBeCalled();
      expect(onPressMove).not.toBeCalled();
      expect(onPressEnd).not.toBeCalled();
      expect(onPress).not.toBeCalled();
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
    it('is called after pointer down: mouse', () => {
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
      const pointerType = 'mouse';
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: buttonsType.auxiliary,
        pointerType,
      });
      target.pointerup({pointerType});
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
    it('is called after virtual middle-button pointer down', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const pointerType = 'mouse';
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: 0,
        pointerType,
      });
      target.pointerup({pointerType});
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
        button: buttonType.auxiliary,
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
    it('is called after virtual middle-button pointer up', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: 0,
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
      target.virtualclick();
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
    it('is called after pointer down and up: %s', () => {
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
    it('is called after pointer up: %s', () => {
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
    it('is called after pointer up: %s', () => {
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
        button: buttonType.auxiliary,
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
      const preventDefaultClick = jest.fn();
      const preventDefaultKeyDown = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        const listener = usePress({onPress});
        return <a href="#" ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter', preventDefault: preventDefaultKeyDown});
      target.virtualclick({preventDefault: preventDefaultClick});
      target.keyup({key: 'Enter'});
      expect(preventDefaultKeyDown).toBeCalled();
      expect(preventDefaultClick).toBeCalled();
      expect(onPress).toHaveBeenCalledTimes(1);
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
      target.virtualclick({preventDefault});
      target.keyup({key: 'Enter'});
      expect(preventDefault).not.toBeCalled();
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: false}),
      );
    });
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
