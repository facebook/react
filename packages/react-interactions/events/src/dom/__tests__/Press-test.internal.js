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
  usePress = require('react-interactions/events/press').usePress;
}

const pointerTypesTable = [['mouse'], ['touch']];

describeWithPointerEvent('Press responder', hasPointerEvents => {
  let container;

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

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

    beforeEach(() => {
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
    });

    test('does not call callbacks for pointers', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown();
      target.pointerup();
      expect(onPressStart).not.toBeCalled();
      expect(onPressChange).not.toBeCalled();
      expect(onPressMove).not.toBeCalled();
      expect(onPressEnd).not.toBeCalled();
      expect(onPress).not.toBeCalled();
    });

    test('does not call callbacks for keyboard', () => {
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

    beforeEach(() => {
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
    });

    it.each(pointerTypesTable)(
      'is called after pointer down: %s',
      pointerType => {
        const target = createEventTarget(ref.current);
        target.pointerdown({pointerType});
        expect(onPressStart).toHaveBeenCalledTimes(1);
        expect(onPressStart).toHaveBeenCalledWith(
          expect.objectContaining({pointerType, type: 'pressstart'}),
        );
      },
    );

    it('is called after middle-button pointer down', () => {
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

    it('is called after virtual middle-button pointer down', () => {
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

    it('ignores any events not caused by primary/middle-click or touch/pen contact', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({buttons: buttonsType.secondary});
      target.pointerup({buttons: buttonsType.secondary});
      target.pointerdown({buttons: buttonsType.eraser});
      target.pointerup({buttons: buttonsType.eraser});
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('is called once after "keydown" events for Enter', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keydown({key: 'Enter'});
      target.keydown({key: 'Enter'});
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    it('is called once after "keydown" events for Spacebar', () => {
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

    it('is not called after "keydown" for other keys', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'a'});
      expect(onPressStart).not.toBeCalled();
    });
  });

  describe('onPressEnd', () => {
    let onPressEnd, ref;

    beforeEach(() => {
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
    });

    it.each(pointerTypesTable)(
      'is called after pointer up: %s',
      pointerType => {
        const target = createEventTarget(ref.current);
        target.pointerdown({pointerType});
        target.pointerup({pointerType});
        expect(onPressEnd).toHaveBeenCalledTimes(1);
        expect(onPressEnd).toHaveBeenCalledWith(
          expect.objectContaining({pointerType, type: 'pressend'}),
        );
      },
    );

    it('is called after middle-button pointer up', () => {
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

    it('is called after virtual middle-button pointer up', () => {
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

    it('is called after "keyup" event for Enter', () => {
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

    it('is called after "keyup" event for Spacebar', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: ' '});
      target.keyup({key: ' '});
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    it('is not called after "keyup" event for other keys', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'a'});
      expect(onPressEnd).not.toBeCalled();
    });

    it('is called with keyboard modifiers', () => {
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

    beforeEach(() => {
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
    });

    it.each(pointerTypesTable)(
      'is called after pointer down and up: %s',
      pointerType => {
        const target = createEventTarget(ref.current);
        target.pointerdown({pointerType});
        expect(onPressChange).toHaveBeenCalledTimes(1);
        expect(onPressChange).toHaveBeenCalledWith(true);
        target.pointerup({pointerType});
        expect(onPressChange).toHaveBeenCalledTimes(2);
        expect(onPressChange).toHaveBeenCalledWith(false);
      },
    );

    it('is called after valid "keydown" and "keyup" events', () => {
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

    beforeEach(() => {
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
    });

    it.each(pointerTypesTable)(
      'is called after pointer up: %s',
      pointerType => {
        const target = createEventTarget(ref.current);
        target.pointerdown({pointerType});
        target.pointerup({pointerType, x: 10, y: 10});
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith(
          expect.objectContaining({pointerType, type: 'press'}),
        );
      },
    );

    it('is not called after middle-button press', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: buttonsType.auxiliary,
        pointerType: 'mouse',
      });
      target.pointerup({pointerType: 'mouse'});
      expect(onPress).not.toHaveBeenCalled();
    });

    it('is not called after virtual middle-button press', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({
        button: buttonType.auxiliary,
        buttons: 0,
        pointerType: 'mouse',
      });
      target.pointerup({pointerType: 'mouse'});
      expect(onPress).not.toHaveBeenCalled();
    });

    it('is called after valid "keyup" event', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'Enter'});
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'press'}),
      );
    });

    it('is not called after invalid "keyup" event', () => {
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

    it('is called with modifier keys', () => {
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

    it('is called once after virtual screen reader "click" event', () => {
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

    beforeEach(() => {
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
    });

    it.each(pointerTypesTable)(
      'is called after pointer move: %s',
      pointerType => {
        const node = ref.current;
        const target = createEventTarget(node);
        target.setBoundingClientRect({x: 0, y: 0, width: 100, height: 100});
        target.pointerdown({pointerType});
        target.pointermove({pointerType, x: 10, y: 10});
        target.pointermove({pointerType, x: 20, y: 20});
        expect(onPressMove).toHaveBeenCalledTimes(2);
        expect(onPressMove).toHaveBeenCalledWith(
          expect.objectContaining({pointerType, type: 'pressmove'}),
        );
      },
    );

    it('is not called if pointer move occurs during keyboard press', () => {
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
});
