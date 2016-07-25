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

describe('ReactDebugToolDev', function() {
  var ReactDebugToolDev;

  beforeEach(function() {
    jest.resetModuleRegistry();
    ReactDebugToolDev = require('ReactDebugToolDev');
  });

  it('should add and remove devtools', () => {
    var handler1 = jasmine.createSpy('spy');
    var handler2 = jasmine.createSpy('spy');
    var devtool1 = {onTestEvent: handler1};
    var devtool2 = {onTestEvent: handler2};

    ReactDebugToolDev.addDevtool(devtool1);
    ReactDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(1);
    expect(handler2.calls.count()).toBe(0);

    ReactDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(2);
    expect(handler2.calls.count()).toBe(0);

    ReactDebugToolDev.addDevtool(devtool2);
    ReactDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(3);
    expect(handler2.calls.count()).toBe(1);

    ReactDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(2);

    ReactDebugToolDev.removeDevtool(devtool1);
    ReactDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);

    ReactDebugToolDev.removeDevtool(devtool2);
    ReactDebugToolDev.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);
  });

  it('warns once when an error is thrown in devtool', () => {
    spyOn(console, 'error');
    ReactDebugToolDev.addDevtool({
      onTestEvent() {
        throw new Error('Hi.');
      },
    });

    ReactDebugToolDev.onTestEvent();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'exception thrown by devtool while handling ' +
      'onTestEvent: Error: Hi.'
    );

    ReactDebugToolDev.onTestEvent();
    expect(console.error.calls.count()).toBe(1);
  });

  it('returns isProfiling state', () => {
    expect(ReactDebugToolDev.isProfiling()).toBe(false);

    ReactDebugToolDev.beginProfiling();
    expect(ReactDebugToolDev.isProfiling()).toBe(true);

    ReactDebugToolDev.endProfiling();
    expect(ReactDebugToolDev.isProfiling()).toBe(false);
  });
});
