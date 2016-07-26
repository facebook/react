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

describe('ReactDOMDebugToolDev', function() {
  var ReactDOMDebugToolDev;

  beforeEach(function() {
    jest.resetModuleRegistry();
    ReactDOMDebugToolDev = require('ReactDOMDebugToolDev');
  });

  it('should add and remove devtools', () => {
    var handler1 = jasmine.createSpy('spy');
    var handler2 = jasmine.createSpy('spy');
    var devtool1 = {onTestEvent: handler1};
    var devtool2 = {onTestEvent: handler2};

    ReactDOMDebugToolDev.addDevtool(devtool1);
    ReactDOMDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(1);
    expect(handler2.calls.count()).toBe(0);

    ReactDOMDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(2);
    expect(handler2.calls.count()).toBe(0);

    ReactDOMDebugToolDev.addDevtool(devtool2);
    ReactDOMDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(3);
    expect(handler2.calls.count()).toBe(1);

    ReactDOMDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(2);

    ReactDOMDebugToolDev.removeDevtool(devtool1);
    ReactDOMDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);

    ReactDOMDebugToolDev.removeDevtool(devtool2);
    ReactDOMDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);
  });

  it('warns once when an error is thrown in devtool', () => {
    spyOn(console, 'error');
    ReactDOMDebugToolDev.addDevtool({
      onTestEvent() {
        throw new Error('Hi.');
      },
    });

    ReactDOMDebugToolDev.onTestEvent();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'exception thrown by devtool while handling ' +
      'onTestEvent: Error: Hi.'
    );

    ReactDOMDebugToolDev.onTestEvent();
    expect(console.error.calls.count()).toBe(1);
  });
});
