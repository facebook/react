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
let useKeyboard;

import {createEventTarget} from 'dom-event-testing-library';

function initializeModules(hasPointerEvents) {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableDeprecatedFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  useKeyboard = require('react-interactions/events/keyboard').useKeyboard;
}

describe('Keyboard responder', () => {
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

  function renderPropagationTest(propagates) {
    const onClickInner = jest.fn(e => propagates && e.continuePropagation());
    const onKeyDownInner = jest.fn(e => propagates && e.continuePropagation());
    const onKeyUpInner = jest.fn(e => propagates && e.continuePropagation());
    const onClickOuter = jest.fn();
    const onKeyDownOuter = jest.fn();
    const onKeyUpOuter = jest.fn();
    const ref = React.createRef();
    const Component = () => {
      const listenerInner = useKeyboard({
        onClick: onClickInner,
        onKeyDown: onKeyDownInner,
        onKeyUp: onKeyUpInner,
      });
      const listenerOuter = useKeyboard({
        onClick: onClickOuter,
        onKeyDown: onKeyDownOuter,
        onKeyUp: onKeyUpOuter,
      });
      return (
        <div DEPRECATED_flareListeners={listenerOuter}>
          <div ref={ref} DEPRECATED_flareListeners={listenerInner} />
        </div>
      );
    };
    ReactDOM.render(<Component />, container);
    return {
      onClickInner,
      onKeyDownInner,
      onKeyUpInner,
      onClickOuter,
      onKeyDownOuter,
      onKeyUpOuter,
      ref,
    };
  }

  test('propagates key event when a continuePropagation() is used', () => {
    const {
      onClickInner,
      onKeyDownInner,
      onKeyUpInner,
      onClickOuter,
      onKeyDownOuter,
      onKeyUpOuter,
      ref,
    } = renderPropagationTest(true);
    const target = createEventTarget(ref.current);
    target.keydown();
    expect(onKeyDownInner).toBeCalled();
    expect(onKeyDownOuter).toBeCalled();
    target.keyup();
    expect(onKeyUpInner).toBeCalled();
    expect(onKeyUpOuter).toBeCalled();
    target.virtualclick();
    expect(onClickInner).toBeCalled();
    expect(onClickOuter).toBeCalled();
  });

  test('does not propagate key event by default', () => {
    const {
      onClickInner,
      onKeyDownInner,
      onKeyUpInner,
      onClickOuter,
      onKeyDownOuter,
      onKeyUpOuter,
      ref,
    } = renderPropagationTest(false);
    const target = createEventTarget(ref.current);
    target.keydown();
    expect(onKeyDownInner).toBeCalled();
    expect(onKeyDownOuter).not.toBeCalled();
    target.keyup();
    expect(onKeyUpInner).toBeCalled();
    expect(onKeyUpOuter).not.toBeCalled();
    target.virtualclick();
    expect(onClickInner).toBeCalled();
    expect(onClickOuter).not.toBeCalled();
  });

  describe('disabled', () => {
    let onKeyDown, onKeyUp, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      onKeyUp = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({disabled: true, onKeyDown, onKeyUp});
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    test('does not call callbacks', () => {
      const target = createEventTarget(ref.current);
      target.keydown();
      target.keyup();
      expect(onKeyDown).not.toBeCalled();
      expect(onKeyUp).not.toBeCalled();
    });
  });

  describe('onClick', () => {
    let onClick, ref;

    beforeEach(() => {
      onClick = jest.fn(e => {
        e.preventDefault();
      });
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({onClick});
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    // e.g, "Enter" on link
    test('click is between key events', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'Enter'});
      target.virtualclick();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          defaultPrevented: true,
          metaKey: false,
          pointerType: 'keyboard',
          shiftKey: false,
          target: target.node,
          timeStamp: expect.any(Number),
          type: 'keyboard:click',
        }),
      );
    });

    // e.g., "Spacebar" on button
    test('click is after key events', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Enter'});
      target.keyup({key: 'Enter'});
      target.virtualclick();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          defaultPrevented: true,
          metaKey: false,
          pointerType: 'keyboard',
          shiftKey: false,
          target: target.node,
          timeStamp: expect.any(Number),
          type: 'keyboard:click',
        }),
      );
    });

    // e.g, generated by a screen-reader
    test('click is orphan', () => {
      const target = createEventTarget(ref.current);
      target.virtualclick();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          defaultPrevented: true,
          metaKey: false,
          pointerType: 'keyboard',
          shiftKey: false,
          target: target.node,
          timeStamp: expect.any(Number),
          type: 'keyboard:click',
        }),
      );
    });
  });

  describe('onKeyDown', () => {
    let onKeyDown, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({onKeyDown});
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    test('key down', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Q'});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          defaultPrevented: false,
          isComposing: false,
          key: 'Q',
          metaKey: false,
          pointerType: 'keyboard',
          shiftKey: false,
          target: target.node,
          timeStamp: expect.any(Number),
          type: 'keyboard:keydown',
        }),
      );
    });

    test('modified key down', () => {
      const target = createEventTarget(ref.current);
      target.keydown({
        key: 'Q',
        altKey: true,
        ctrlKey: true,
        shiftKey: true,
        metaKey: true,
      });
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: true,
          ctrlKey: true,
          defaultPrevented: false,
          isComposing: false,
          key: 'Q',
          metaKey: true,
          pointerType: 'keyboard',
          shiftKey: true,
          target: target.node,
          timeStamp: expect.any(Number),
          type: 'keyboard:keydown',
        }),
      );
    });
  });

  describe('onKeyUp', () => {
    let onKeyUp, ref;

    beforeEach(() => {
      onKeyUp = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({onKeyUp});
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    test('key up', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Q'});
      target.keyup({key: 'Q'});
      expect(onKeyUp).toHaveBeenCalledTimes(1);
      expect(onKeyUp).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: false,
          ctrlKey: false,
          defaultPrevented: false,
          isComposing: false,
          key: 'Q',
          metaKey: false,
          pointerType: 'keyboard',
          shiftKey: false,
          target: target.node,
          timeStamp: expect.any(Number),
          type: 'keyboard:keyup',
        }),
      );
    });

    test('modified key up', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Q'});
      target.keyup({
        key: 'Q',
        altKey: true,
        ctrlKey: true,
        shiftKey: true,
        metaKey: true,
      });
      expect(onKeyUp).toHaveBeenCalledWith(
        expect.objectContaining({
          altKey: true,
          ctrlKey: true,
          defaultPrevented: false,
          isComposing: false,
          key: 'Q',
          metaKey: true,
          pointerType: 'keyboard',
          shiftKey: true,
          target: target.node,
          timeStamp: expect.any(Number),
          type: 'keyboard:keyup',
        }),
      );
    });
  });

  describe('preventDefault for onClick', () => {
    function render(props) {
      const ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard(props);
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      return ref;
    }

    test('does not prevent native click by default', () => {
      const onClick = jest.fn();
      const preventDefault = jest.fn();
      const ref = render({onClick});

      const target = createEventTarget(ref.current);
      target.virtualclick({preventDefault});

      expect(preventDefault).not.toBeCalled();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPrevented: false,
        }),
      );
    });

    test('prevents native behaviour with preventDefault', () => {
      const onClick = jest.fn(e => e.preventDefault());
      const preventDefault = jest.fn();
      const ref = render({onClick});

      const target = createEventTarget(ref.current);
      target.virtualclick({preventDefault});
      expect(preventDefault).toBeCalled();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPrevented: true,
        }),
      );
    });
  });

  describe('preventDefault for onKeyDown', () => {
    function render(props) {
      const ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard(props);
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      return ref;
    }

    test('key config matches', () => {
      const onKeyDown = jest.fn(e => {
        if (e.key === 'Tab') {
          e.preventDefault();
        }
      });
      const preventDefault = jest.fn();
      const preventDefaultClick = jest.fn();
      const ref = render({onKeyDown});

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault});
      target.virtualclick({preventDefault: preventDefaultClick});

      expect(preventDefault).toBeCalled();
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPrevented: true,
          key: 'Tab',
          type: 'keyboard:keydown',
        }),
      );
    });

    test('key config matches (modifier keys)', () => {
      const onKeyDown = jest.fn(e => {
        if (e.key === 'Tab' && e.shiftKey) {
          e.preventDefault();
        }
      });
      const preventDefault = jest.fn();
      const ref = render({onKeyDown});

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, shiftKey: true});
      expect(preventDefault).toBeCalled();
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPrevented: true,
          key: 'Tab',
          shiftKey: true,
          type: 'keyboard:keydown',
        }),
      );
    });

    test('key config does not match (modifier keys)', () => {
      const onKeyDown = jest.fn(e => {
        if (e.key === 'Tab' && e.shiftKey) {
          e.preventDefault();
        }
      });
      const preventDefault = jest.fn();
      const ref = render({onKeyDown});

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, shiftKey: false});
      expect(preventDefault).not.toBeCalled();
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPrevented: false,
          key: 'Tab',
          shiftKey: false,
          type: 'keyboard:keydown',
        }),
      );
    });
  });
});
