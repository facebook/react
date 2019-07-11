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
let Scroll;

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

describe('Scroll event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableFlareAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Scroll = require('react-events/scroll').Scroll;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onScroll, ref;

    beforeEach(() => {
      onScroll = jest.fn();
      ref = React.createRef();
      const element = (
        <Scroll disabled={true} onScroll={onScroll}>
          <div ref={ref} />
        </Scroll>
      );
      ReactDOM.render(element, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createEvent('scroll'));
      expect(onScroll).not.toBeCalled();
    });
  });

  describe('onScroll', () => {
    let onScroll, ref;

    beforeEach(() => {
      onScroll = jest.fn();
      ref = React.createRef();
      const element = (
        <Scroll onScroll={onScroll}>
          <div ref={ref} />
        </Scroll>
      );
      ReactDOM.render(element, container);
    });

    describe('is called after "scroll" event', () => {
      it('with a mouse pointerType', () => {
        ref.current.dispatchEvent(
          createEvent('pointerdown', {
            pointerType: 'mouse',
          }),
        );
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledTimes(1);
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'mouse',
            type: 'scroll',
            direction: '',
          }),
        );
        onScroll.mockReset();
        ref.current.scrollTop = -1;
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'mouse',
            type: 'scroll',
            direction: 'up',
          }),
        );
        onScroll.mockReset();
        ref.current.scrollTop = 1;
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'mouse',
            type: 'scroll',
            direction: 'down',
          }),
        );
      });

      it('with a touch pointerType', () => {
        ref.current.dispatchEvent(
          createEvent('pointerdown', {
            pointerType: 'touch',
          }),
        );
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledTimes(1);
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'touch',
            type: 'scroll',
            direction: '',
          }),
        );
        onScroll.mockReset();
        ref.current.scrollTop = -1;
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'touch',
            type: 'scroll',
            direction: 'up',
          }),
        );
        onScroll.mockReset();
        ref.current.scrollTop = 1;
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'touch',
            type: 'scroll',
            direction: 'down',
          }),
        );
      });

      it('with a pen pointerType', () => {
        ref.current.dispatchEvent(
          createEvent('pointerdown', {
            pointerType: 'pen',
          }),
        );
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledTimes(1);
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'pen',
            type: 'scroll',
            direction: '',
          }),
        );
        onScroll.mockReset();
        ref.current.scrollTop = -1;
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'pen',
            type: 'scroll',
            direction: 'up',
          }),
        );
        onScroll.mockReset();
        ref.current.scrollTop = 1;
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'pen',
            type: 'scroll',
            direction: 'down',
          }),
        );
      });

      it('with a keyboard pointerType', () => {
        ref.current.dispatchEvent(
          createEvent('keydown', {
            key: 'A',
          }),
        );
        ref.current.dispatchEvent(
          createEvent('keyup', {
            key: 'A',
          }),
        );
        ref.current.dispatchEvent(createEvent('scroll'));
        expect(onScroll).toHaveBeenCalledTimes(1);
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType: 'keyboard',
            type: 'scroll',
            direction: '',
          }),
        );
      });
    });
  });

  describe('onScrollDragStart', () => {
    let onScrollDragStart, ref;

    beforeEach(() => {
      onScrollDragStart = jest.fn();
      ref = React.createRef();
      const element = (
        <Scroll onScrollDragStart={onScrollDragStart}>
          <div ref={ref} />
        </Scroll>
      );
      ReactDOM.render(element, container);
    });

    it('works as expected with touch events', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('scroll'));
      expect(onScrollDragStart).toHaveBeenCalledTimes(1);
      expect(onScrollDragStart).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'touch',
          type: 'scrolldragstart',
          direction: '',
        }),
      );
    });
  });

  describe('onScrollDragEnd', () => {
    let onScrollDragEnd, ref;

    beforeEach(() => {
      onScrollDragEnd = jest.fn();
      ref = React.createRef();
      const element = (
        <Scroll onScrollDragEnd={onScrollDragEnd}>
          <div ref={ref} />
        </Scroll>
      );
      ReactDOM.render(element, container);
    });

    it('works as expected with touch events', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('scroll'));
      ref.current.dispatchEvent(createEvent('touchend'));
      expect(onScrollDragEnd).toHaveBeenCalledTimes(1);
      expect(onScrollDragEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'touch',
          type: 'scrolldragend',
          direction: '',
        }),
      );
    });
  });
});
