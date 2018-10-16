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
let ReactDOM;
let ConcurrentMode;

beforeEach(() => {
  React = require('react');
  ConcurrentMode = React.unstable_ConcurrentMode;
  ReactDOM = require('react-dom');
});

describe('ReactDOMImg', () => {
  let container;

  beforeEach(() => {
    // TODO pull this into helper method, reduce repetition.
    // mock the browser APIs which are used in schedule:
    // - requestAnimationFrame should pass the DOMHighResTimeStamp argument
    // - calling 'window.postMessage' should actually fire postmessage handlers
    global.requestAnimationFrame = function(cb) {
      return setTimeout(() => {
        cb(Date.now());
      });
    };
    const originalAddEventListener = global.addEventListener;
    let postMessageCallback;
    global.addEventListener = function(eventName, callback, useCapture) {
      if (eventName === 'message') {
        postMessageCallback = callback;
      } else {
        originalAddEventListener(eventName, callback, useCapture);
      }
    };
    global.postMessage = function(messageKey, targetOrigin) {
      const postMessageEvent = {source: window, data: messageKey};
      if (postMessageCallback) {
        postMessageCallback(postMessageEvent);
      }
    };
    jest.resetModules();
    container = document.createElement('div');
    ReactDOM = require('react-dom');

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should trigger load events even if they fire early', () => {
    const onLoadSpy = jest.fn();

    const loadEvent = document.createEvent('Event');
    loadEvent.initEvent('load', false, false);

    // TODO: Write test

    ReactDOM.render(
      <ConcurrentMode>
        <img onLoad={onLoadSpy} />
      </ConcurrentMode>,
    );

    // someHowGetAnImage.dispatchEvent(loadEvent);

    // expect(onLoadSpy).toHaveBeenCalled();
  });
});
