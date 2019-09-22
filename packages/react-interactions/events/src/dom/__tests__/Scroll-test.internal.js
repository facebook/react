/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget, setPointerEvent} from '../testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let useScroll;

const forcePointerEvents = true;
const table = [[forcePointerEvents], [!forcePointerEvents]];

const initializeModules = hasPointerEvents => {
  setPointerEvent(hasPointerEvents);
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  useScroll = require('react-interactions/events/scroll').useScroll;
};

describe.each(table)('Scroll responder', hasPointerEvents => {
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

  describe('disabled', () => {
    let onScroll, ref;

    beforeEach(() => {
      onScroll = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useScroll({
          disabled: true,
          onScroll,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('prevents custom events being dispatched', () => {
      const target = createEventTarget(ref.current);
      target.scroll();
      expect(onScroll).not.toBeCalled();
    });
  });

  describe('onScroll', () => {
    let onScroll, ref;

    beforeEach(() => {
      onScroll = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useScroll({
          onScroll,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    describe('is called after "scroll" event', () => {
      const pointerTypesTable = hasPointerEvents
        ? [['mouse'], ['touch'], ['pen']]
        : [['mouse'], ['touch']];
      it.each(pointerTypesTable)('with pointerType: %s', pointerType => {
        const node = ref.current;
        const target = createEventTarget(node);
        target.pointerdown({pointerType});
        target.scroll();
        expect(onScroll).toHaveBeenCalledTimes(1);
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType,
            type: 'scroll',
            direction: '',
          }),
        );
        onScroll.mockReset();
        node.scrollTop = -1;
        target.scroll();
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType,
            type: 'scroll',
            direction: 'up',
          }),
        );
        onScroll.mockReset();
        node.scrollTop = 1;
        target.scroll();
        expect(onScroll).toHaveBeenCalledWith(
          expect.objectContaining({
            pointerType,
            type: 'scroll',
            direction: 'down',
          }),
        );
      });

      it('with pointerType: keyboard', () => {
        const target = createEventTarget(ref.current);
        target.keydown({key: 'A'});
        target.keyup({key: 'A'});
        target.scroll();
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
      const Component = () => {
        const listener = useScroll({
          onScrollDragStart,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('works as expected with touch events', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.scroll();
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
      const Component = () => {
        const listener = useScroll({
          onScrollDragEnd,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('works as expected with touch events', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.scroll();
      target.pointerup({pointerType: 'touch'});
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
