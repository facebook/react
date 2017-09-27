/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

jest.mock('isEventSupported');

describe('EventPluginHub', () => {
  var React;
  var ReactTestUtils;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should prevent non-function listeners, at dispatch', () => {
    spyOn(console, 'error');
    var node = ReactTestUtils.renderIntoDocument(
      <div onClick="not a function" />,
    );
    expect(function() {
      ReactTestUtils.SimulateNative.click(node);
    }).toThrowError(
      'Expected `onClick` listener to be a function, instead got a value of `string` type.',
    );
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Expected `onClick` listener to be a function, instead got a value of `string` type.',
    );
  });

  it('should not prevent null listeners, at dispatch', () => {
    var node = ReactTestUtils.renderIntoDocument(<div onClick={null} />);
    expect(function() {
      ReactTestUtils.SimulateNative.click(node);
    }).not.toThrow();
  });
});
