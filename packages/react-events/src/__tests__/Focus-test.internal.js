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
let Focus;

const createFocusEvent = type => {
  const event = document.createEvent('Event');
  event.initEvent(type, true, true);
  return event;
};

describe('Focus event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Focus = require('react-events/focus');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('onBlur', () => {
    let onBlur, ref;

    beforeEach(() => {
      onBlur = jest.fn();
      ref = React.createRef();
      const element = (
        <Focus onBlur={onBlur}>
          <div ref={ref} />
        </Focus>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "blur" event', () => {
      ref.current.dispatchEvent(createFocusEvent('focus'));
      ref.current.dispatchEvent(createFocusEvent('blur'));
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('onFocus', () => {
    let onFocus, ref;

    beforeEach(() => {
      onFocus = jest.fn();
      ref = React.createRef();
      const element = (
        <Focus onFocus={onFocus}>
          <div ref={ref} />
        </Focus>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "focus" event', () => {
      ref.current.dispatchEvent(createFocusEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('onFocusChange', () => {
    let onFocusChange, ref;

    beforeEach(() => {
      onFocusChange = jest.fn();
      ref = React.createRef();
      const element = (
        <Focus onFocusChange={onFocusChange}>
          <div ref={ref} />
        </Focus>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "blur" and "focus" events', () => {
      ref.current.dispatchEvent(createFocusEvent('focus'));
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createFocusEvent('blur'));
      expect(onFocusChange).toHaveBeenCalledTimes(2);
      expect(onFocusChange).toHaveBeenCalledWith(false);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(Focus.displayName).toBe('Focus');
  });
});
