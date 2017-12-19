/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

jest.mock('../events/isEventSupported');

describe('EventPluginHub', () => {
  let React;
  let ReactTestUtils;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should prevent non-function listeners, at dispatch', () => {
    let node;
    expect(() => {
      node = ReactTestUtils.renderIntoDocument(
        <div onClick="not a function" />,
      );
    }).toWarnDev(
      'Expected `onClick` listener to be a function, instead got a value of `string` type.',
    );
    expect(() => ReactTestUtils.SimulateNative.click(node)).toThrowError(
      'Expected `onClick` listener to be a function, instead got a value of `string` type.',
    );
  });

  it('should not prevent null listeners, at dispatch', () => {
    const node = ReactTestUtils.renderIntoDocument(<div onClick={null} />);
    expect(function() {
      ReactTestUtils.SimulateNative.click(node);
    }).not.toThrow();
  });
});
