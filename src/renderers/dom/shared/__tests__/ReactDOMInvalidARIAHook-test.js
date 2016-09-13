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

describe('ReactDOMInvalidARIAHook', () => {
  var React;
  var ReactDOM;
  var ReactTestUtils;
  var mountComponent;

  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');

    mountComponent = function(props) {
      ReactTestUtils.renderIntoDocument(<div {...props} />);
    };
  });

  describe('aria-* props', () => {
    it('should allow valid aria-* props', () => {
      spyOn(console, 'error');
      mountComponent({'aria-label': 'Bumble bees'});
      expect(console.error.calls.count()).toBe(0);
    });
    it('should warn for invalid aria-* props', () => {
      spyOn(console, 'error');
      mountComponent({'aria-badprop': 'maybe'});
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Invalid aria prop `aria-badprop` on <div> tag. ' +
        'For details, see https://fb.me/invalid-aria-prop'
      );
    });
  });
});