/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should prevent non-function listeners, at dispatch', () => {
    var node = ReactTestUtils.renderIntoDocument(
      <div onClick="not a function" />
    );
    expect(function() {
      ReactTestUtils.SimulateNative.click(node);
    }).toThrowError(
      'Expected onClick listener to be a function, instead got type string'
    );
  });

  it('should not prevent null listeners, at dispatch', () => {
    var node = ReactTestUtils.renderIntoDocument(
      <div onClick={null} />
    );
    expect(function() {
      ReactTestUtils.SimulateNative.click(node);
    }).not.toThrow();
  });

});
