/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDebugTool', () => {
  var ReactDebugTool;

  beforeEach(() => {
    jest.resetModules();
    ReactDebugTool = require('ReactDebugTool');
  });

  it('should add and remove hooks', () => {
    var handler1 = jasmine.createSpy('spy');
    var handler2 = jasmine.createSpy('spy');
    var hook1 = {onTestEvent: handler1};
    var hook2 = {onTestEvent: handler2};

    ReactDebugTool.addHook(hook1);
    ReactDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(1);
    expect(handler2.calls.count()).toBe(0);

    ReactDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(2);
    expect(handler2.calls.count()).toBe(0);

    ReactDebugTool.addHook(hook2);
    ReactDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(3);
    expect(handler2.calls.count()).toBe(1);

    ReactDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(2);

    ReactDebugTool.removeHook(hook1);
    ReactDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);

    ReactDebugTool.removeHook(hook2);
    ReactDebugTool.onTestEvent();
    expect(handler1.calls.count()).toBe(4);
    expect(handler2.calls.count()).toBe(3);
  });

  it('warns once when an error is thrown in hook', () => {
    spyOn(console, 'error');
    ReactDebugTool.addHook({
      onTestEvent() {
        throw new Error('Hi.');
      },
    });

    ReactDebugTool.onTestEvent();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Exception thrown by hook while handling ' + 'onTestEvent: Error: Hi.',
    );

    ReactDebugTool.onTestEvent();
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('returns isProfiling state', () => {
    expect(ReactDebugTool.isProfiling()).toBe(false);

    ReactDebugTool.beginProfiling();
    expect(ReactDebugTool.isProfiling()).toBe(true);

    ReactDebugTool.endProfiling();
    expect(ReactDebugTool.isProfiling()).toBe(false);
  });
});
