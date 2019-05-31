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
let InteractOutside;

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

function init() {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableEventAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  InteractOutside = require('react-events/interact-outside');
}

describe('Event responder: InteractOutside', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    init();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onInteractOutside, ref;

    beforeEach(() => {
      onInteractOutside = jest.fn();
      ref = React.createRef();
      const element = (
        <div>
          <div ref={ref}>I am outside</div>
          <InteractOutside
            disabled={true}
            onInteractOutside={onInteractOutside}>
            <div>I am inside</div>
          </InteractOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractOutside).not.toBeCalled();
    });
  });

  describe('onInteractOutside', () => {
    let onInteractOutside, outsideRef, insideRef;

    beforeEach(() => {
      onInteractOutside = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <InteractOutside onInteractOutside={onInteractOutside}>
            <div ref={insideRef}>I am inside</div>
          </InteractOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerup" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
      expect(onInteractOutside).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'interactoutside'}),
      );
    });

    it('is called after "pointerup" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onInteractOutside).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (inside -> outside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onInteractOutside).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (outside -> inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onInteractOutside).toHaveBeenCalledTimes(0);
    });

    it('is called after valid "keyup" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
      expect(onInteractOutside).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
          type: 'interactoutside',
        }),
      );
    });

    it('is called after valid "keyup" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onInteractOutside).toHaveBeenCalledTimes(0);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(InteractOutside.displayName).toBe('InteractOutside');
  });
});
