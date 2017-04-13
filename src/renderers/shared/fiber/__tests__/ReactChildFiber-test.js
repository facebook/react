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

var React;
var ReactTestUtils;
var ReactFeatureFlags;

describe('ReactChildFiber', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestUtils = require('ReactTestUtils');
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = false;
  });

  it('warns for keys for arrays of elements in a fragment', () => {
    spyOn(console, 'error');
    class ComponentReturningArray extends React.Component {
      render() {
        return [<div />, <div />];
      }
    }

    ReactTestUtils.renderIntoDocument(
      React.createElement(ComponentReturningArray),
    );

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: ' +
      'Each child in an array or iterator should have a unique "key" prop.' +
      ' See https://fb.me/react-warning-keys for more information.' +
      '\n    in div (at ReactChildFiber-test.js:32)' +
      '\n    in ComponentReturningArray'
    );
  });

  it('does not warn when there are keys on  elements in a fragment', () => {
    spyOn(console, 'error');
    class ComponentReturningArray extends React.Component {
      render() {
        return [<div key="foo" />, <div key="bar" />];
      }
    }

    ReactTestUtils.renderIntoDocument(
      React.createElement(ComponentReturningArray),
    );

    expectDev(console.error.calls.count()).toBe(0);
  });
});
