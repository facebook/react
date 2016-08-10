/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMDebugTool', function() {
  var ReactDOMDebugTool;

  beforeEach(function() {
    jest.resetModuleRegistry();
    ReactDOMDebugTool = require('ReactDOMDebugTool');
  });

  it('should add and remove hooks', () => {
    var handler1 = jasmine.createSpy('spy');
    var handler2 = jasmine.createSpy('spy');
    var hook1 = {onTestEvent: handler1};
    var hook2 = {onTestEvent: handler2};

    ReactDOMDebugTool.addHook(hook1);
    ReactDOMDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(1);
    expect(handler2.calls.count()).toBe(0);

    ReactDOMDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(2);
    expect(handler2.calls.count()).toBe(0);

    ReactDOMDebugTool.addHook(hook2);
    ReactDOMDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(3);
    expect(handler2.calls.count()).toBe(1);

    ReactDOMDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(2);

    ReactDOMDebugTool.removeHook(hook1);
    ReactDOMDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);

    ReactDOMDebugTool.removeHook(hook2);
    ReactDOMDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);
  });

  it('warns once when an error is thrown in hook', () => {
    spyOn(console, 'error');
    ReactDOMDebugTool.addHook({
      onTestEvent() {
        throw new Error('Hi.');
      },
    });

    ReactDOMDebugTool.onTestEvent();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Exception thrown by hook while handling ' +
      'onTestEvent: Error: Hi.'
    );

    ReactDOMDebugTool.onTestEvent();
    expect(console.error.calls.count()).toBe(1);
  });
});
