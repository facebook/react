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

import {createEventTarget} from '../testing-library';

function initializeModules(hasPointerEvents) {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  useKeyboard = require('react-events/keyboard').useKeyboard;
}

describe('Keyboard responder', () => {
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

  function renderPropagationTest(propagates) {
    const onKeyDownInner = jest.fn(() => propagates);
    const onKeyDownOuter = jest.fn();
    const onKeyUpInner = jest.fn(() => propagates);
    const onKeyUpOuter = jest.fn();
    const ref = React.createRef();
    const Component = () => {
      const listenerInner = useKeyboard({
        onKeyDown: onKeyDownInner,
        onKeyUp: onKeyUpInner,
      });
      const listenerOuter = useKeyboard({
        onKeyDown: onKeyDownOuter,
        onKeyUp: onKeyUpOuter,
      });
      return (
        <div listeners={listenerOuter}>
          <div ref={ref} listeners={listenerInner} />
        </div>
      );
    };
    ReactDOM.render(<Component />, container);
    return {
      onKeyDownInner,
      onKeyDownOuter,
      onKeyUpInner,
      onKeyUpOuter,
      ref,
    };
  }

  test('propagates event when a callback returns true', () => {
    const {
      onKeyDownInner,
      onKeyDownOuter,
      onKeyUpInner,
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
  });

  test('does not propagate event when a callback returns false', () => {
    const {
      onKeyDownInner,
      onKeyDownOuter,
      onKeyUpInner,
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
  });

  describe('disabled', () => {
    let onKeyDown, onKeyUp, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      onKeyUp = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({disabled: true, onKeyDown, onKeyUp});
        return <div ref={ref} listeners={listener} />;
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

  describe('onKeyDown', () => {
    let onKeyDown, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({onKeyDown});
        return <div ref={ref} listeners={listener} />;
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
        return <div ref={ref} listeners={listener} />;
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

  describe('preventKeys', () => {
    function render(props) {
      const ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard(props);
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
      return ref;
    }

    test('key config matches', () => {
      const onKeyDown = jest.fn();
      const preventDefault = jest.fn();
      const preventDefaultClick = jest.fn();
      const ref = render({onKeyDown, preventKeys: ['Tab']});

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault});
      target.click({preventDefault: preventDefaultClick});

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).toBeCalled();
      expect(preventDefaultClick).toBeCalled();
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPrevented: true,
          key: 'Tab',
          type: 'keyboard:keydown',
        }),
      );
    });

    test('key config matches (modifier keys)', () => {
      const onKeyDown = jest.fn();
      const preventDefault = jest.fn();
      const preventDefaultClick = jest.fn();
      const ref = render({onKeyDown, preventKeys: [['Tab', {shiftKey: true}]]});

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, shiftKey: true});
      target.click({preventDefault: preventDefaultClick, shiftKey: true});

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).toBeCalled();
      expect(preventDefaultClick).toBeCalled();
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
      const onKeyDown = jest.fn();
      const preventDefault = jest.fn();
      const preventDefaultClick = jest.fn();
      const ref = render({onKeyDown, preventKeys: [['Tab', {shiftKey: true}]]});

      const target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, shiftKey: false});
      target.click({preventDefault: preventDefaultClick, shiftKey: false});

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).not.toBeCalled();
      expect(preventDefaultClick).not.toBeCalled();
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
