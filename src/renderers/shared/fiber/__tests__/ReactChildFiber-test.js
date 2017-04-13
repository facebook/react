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

var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

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

  if (ReactDOMFeatureFlags.useFiber) {
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
        'Each child in an array or iterator should have a unique "key" prop.'
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
  } else {
    // must run at least one test, otherwise Jest complains
    it('warns when you try to render a fragment', () => {
      class ComponentReturningArray extends React.Component {
        render() {
          return [<div key="foo" />, <div key="bar" />];
        }
      }

      expect(function() {
        ReactTestUtils.renderIntoDocument(<ComponentReturningArray />);
      }).toThrowError(
        'ComponentReturningArray.render(): A valid React element (or null) ' +
        'must be returned. You may have returned undefined, an array ' +
        'or some other invalid object.',
      );
    });
  }
});
