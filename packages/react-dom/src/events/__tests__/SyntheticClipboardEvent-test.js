/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;

describe('SyntheticClipboardEvent', () => {
  var simulateEvent;
  var container;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

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
          var expectedCount = 0;

          // Mock clipboardData since jsdom implementation doesn't have a constructor
          var clipboardData = {
            dropEffect: null,
            effectAllowed: null,
            files: null,
            items: null,
            types: null,
          };
          var eventHandler = event => {
            expect(event.clipboardData).toBe(clipboardData);
            expectedCount++;
          };
          var div = ReactDOM.render(
            <div
              onCopy={eventHandler}
              onCut={eventHandler}
              onPaste={eventHandler}
            />,
            container,
          );

          var event;
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
      var expectedCount = 0;
      var div;

      var eventHandler = type => event => {
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

      var event;
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

    it('is able to `preventDefault` and `stopPropagation`', () => {
      var expectedCount = 0;

      var eventHandler = event => {
        expect(event.isDefaultPrevented()).toBe(false);
        event.preventDefault();
        expect(event.isDefaultPrevented()).toBe(true);
        expect(event.isPropagationStopped()).toBe(false);
        event.stopPropagation();
        expect(event.isPropagationStopped()).toBe(true);
        expectedCount++;
      };

      var div = ReactDOM.render(
        <div
          onCopy={eventHandler}
          onCut={eventHandler}
          onPaste={eventHandler}
        />,
        container,
      );

      var event;
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
      var expectedCount = 0;

      var eventHandler = event => {
        expect(event.isPersistent()).toBe(false);
        event.persist();
        expect(event.isPersistent()).toBe(true);
        expectedCount++;
      };

      var div = ReactDOM.render(
        <div
          onCopy={eventHandler}
          onCut={eventHandler}
          onPaste={eventHandler}
        />,
        container,
      );

      var event;
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
  });
});
