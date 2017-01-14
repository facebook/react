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
  var ReactTestUtils;
  var mountComponent;

  beforeEach(() => {
    jest.resetModules();
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    mountComponent = function(props) {
      ReactTestUtils.renderIntoDocument(<div {...props} />);
    };
  });

  describe('aria-* props', () => {
    it('should allow valid aria-* props', () => {
      spyOn(console, 'error');
      mountComponent({'aria-label': 'Bumble bees'});
      expectDev(console.error.calls.count()).toBe(0);
    });
    it('should warn for one invalid aria-* prop', () => {
      spyOn(console, 'error');
      mountComponent({'aria-badprop': 'maybe'});
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Invalid aria prop `aria-badprop` on <div> tag. ' +
        'For details, see https://fb.me/invalid-aria-prop'
      );
    });
    it('should warn for many invalid aria-* props', () => {
      spyOn(console, 'error');
      mountComponent(
        {
          'aria-badprop': 'Very tall trees',
          'aria-malprop': 'Turbulent seas',
        }
      );
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Invalid aria props `aria-badprop`, `aria-malprop` on <div> ' +
        'tag. For details, see https://fb.me/invalid-aria-prop'
      );
    });
    it('should warn for an improperly cased aria-* prop', () => {
      spyOn(console, 'error');
      // The valid attribute name is aria-haspopup.
      mountComponent({'aria-hasPopup': 'true'});
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Unknown ARIA attribute aria-hasPopup. ' +
        'Did you mean aria-haspopup?'
      );
    });
  });
});
