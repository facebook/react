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
let KeyboardResponder;
let useKeyboardListener;

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

describe('Keyboard event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableFlareAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    KeyboardResponder = require('react-events/keyboard').KeyboardResponder;
    useKeyboardListener = require('react-events/keyboard').useKeyboardListener;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onKeyDown, onKeyUp, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      onKeyUp = jest.fn();
      ref = React.createRef();
      const Component = () => {
        useKeyboardListener({
          onKeyDown,
          onKeyUp,
        });
        return (
          <div ref={ref} responders={<KeyboardResponder disabled={true} />} />
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createEvent('scroll'));
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
        useKeyboardListener({
          onKeyDown,
        });
        return <div ref={ref} responders={<KeyboardResponder />} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "keydown" event', () => {
      ref.current.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Q',
        }),
      );
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({key: 'Q', type: 'keydown'}),
      );
    });
  });

  describe('onKeyUp', () => {
    let onKeyDown, onKeyUp, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      onKeyUp = jest.fn();
      ref = React.createRef();
      const Component = () => {
        useKeyboardListener({
          onKeyDown,
          onKeyUp,
        });
        return <div ref={ref} responders={<KeyboardResponder />} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "keydown" event', () => {
      ref.current.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Q',
        }),
      );
      ref.current.dispatchEvent(
        new KeyboardEvent('keyup', {
          bubbles: true,
          cancelable: true,
          key: 'Q',
        }),
      );
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({key: 'Q', type: 'keydown'}),
      );
      expect(onKeyUp).toHaveBeenCalledTimes(1);
      expect(onKeyUp).toHaveBeenCalledWith(
        expect.objectContaining({key: 'Q', type: 'keyup'}),
      );
    });
  });
});
