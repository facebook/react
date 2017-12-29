/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('SyntheticClipboardEvent', () => {
  let container;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('ClipboardEvent interface', () => {
    describe('clipboardData', () => {
      describe('when event has clipboardData', () => {
        it("returns event's clipboardData", () => {
          let expectedCount = 0;

          // Mock clipboardData since jsdom implementation doesn't have a constructor
          const clipboardData = {
            dropEffect: null,
            effectAllowed: null,
            files: null,
            items: null,
            types: null,
          };
          const eventHandler = event => {
            expect(event.clipboardData).toBe(clipboardData);
            expectedCount++;
          };
          const div = ReactDOM.render(
            <div
              onCopy={eventHandler}
              onCut={eventHandler}
              onPaste={eventHandler}
            />,
            container,
          );

          let event;
          event = document.createEvent('Event');
          event.initEvent('copy', true, true);
          event.clipboardData = clipboardData;
          div.dispatchEvent(event);

          event = document.createEvent('Event');
          event.initEvent('cut', true, true);
          event.clipboardData = clipboardData;
          div.dispatchEvent(event);

          event = document.createEvent('Event');
          event.initEvent('paste', true, true);
          event.clipboardData = clipboardData;
          div.dispatchEvent(event);

          expect(expectedCount).toBe(3);
        });
      });
    });
  });

  describe('EventInterface', () => {
    it('normalizes properties from the Event interface', () => {
      let expectedCount = 0;
      let div;

      const eventHandler = type => event => {
        expect(event.target).toBe(div);
        expect(event.type).toBe(type);
        expectedCount++;
      };

      div = ReactDOM.render(
        <div
          onCopy={eventHandler('copy')}
          onCut={eventHandler('cut')}
          onPaste={eventHandler('paste')}
        />,
        container,
      );

      let event;
      event = document.createEvent('Event');
      event.initEvent('copy', true, true);
      // Emulate IE8
      Object.defineProperty(event, 'target', {
        get() {},
      });
      Object.defineProperty(event, 'srcElement', {
        get() {
          return div;
        },
      });
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('cut', true, true);
      // Emulate IE8
      Object.defineProperty(event, 'target', {
        get() {},
      });
      Object.defineProperty(event, 'srcElement', {
        get() {
          return div;
        },
      });
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('paste', true, true);
      // Emulate IE8
      Object.defineProperty(event, 'target', {
        get() {},
      });
      Object.defineProperty(event, 'srcElement', {
        get() {
          return div;
        },
      });
      div.dispatchEvent(event);

      expect(expectedCount).toBe(3);
    });

    it('is able to `preventDefault` and `stopPropagation`', () => {
      let expectedCount = 0;

      const eventHandler = event => {
        expect(event.isDefaultPrevented()).toBe(false);
        event.preventDefault();
        expect(event.isDefaultPrevented()).toBe(true);
        expect(event.isPropagationStopped()).toBe(false);
        event.stopPropagation();
        expect(event.isPropagationStopped()).toBe(true);
        expectedCount++;
      };

      const div = ReactDOM.render(
        <div
          onCopy={eventHandler}
          onCut={eventHandler}
          onPaste={eventHandler}
        />,
        container,
      );

      let event;
      event = document.createEvent('Event');
      event.initEvent('copy', true, true);
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('cut', true, true);
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('paste', true, true);
      div.dispatchEvent(event);

      expect(expectedCount).toBe(3);
    });

    it('is able to `persist`', () => {
      const persistentEvents = [];
      const eventHandler = event => {
        expect(event.isPersistent()).toBe(false);
        event.persist();
        expect(event.isPersistent()).toBe(true);
        persistentEvents.push(event);
      };

      const div = ReactDOM.render(
        <div
          onCopy={eventHandler}
          onCut={eventHandler}
          onPaste={eventHandler}
        />,
        container,
      );

      let event;
      event = document.createEvent('Event');
      event.initEvent('copy', true, true);
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('cut', true, true);
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('paste', true, true);
      div.dispatchEvent(event);

      expect(persistentEvents.length).toBe(3);
      expect(persistentEvents[0].type).toBe('copy');
      expect(persistentEvents[1].type).toBe('cut');
      expect(persistentEvents[2].type).toBe('paste');
    });
  });
});
