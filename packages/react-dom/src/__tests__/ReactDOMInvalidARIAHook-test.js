/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMInvalidARIAHook', () => {
  let React;
  let ReactTestUtils;
  let mountComponent;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');

    mountComponent = function(props) {
      ReactTestUtils.renderIntoDocument(<div {...props} />);
    };
  });

  describe('aria-* props', () => {
    it('should allow valid aria-* props', () => {
      mountComponent({'aria-label': 'Bumble bees'});
    });
    it('should warn for one invalid aria-* prop', () => {
      expect(() => mountComponent({'aria-badprop': 'maybe'})).toWarnDev(
        'Warning: Invalid aria prop `aria-badprop` on <div> tag. ' +
          'For details, see https://fb.me/invalid-aria-prop',
      );
    });
    it('should warn for many invalid aria-* props', () => {
      expect(() =>
        mountComponent({
          'aria-badprop': 'Very tall trees',
          'aria-malprop': 'Turbulent seas',
        }),
      ).toWarnDev(
        'Warning: Invalid aria props `aria-badprop`, `aria-malprop` on <div> ' +
          'tag. For details, see https://fb.me/invalid-aria-prop',
      );
    });
    it('should warn for an improperly cased aria-* prop', () => {
      // The valid attribute name is aria-haspopup.
      expect(() => mountComponent({'aria-hasPopup': 'true'})).toWarnDev(
        'Warning: Unknown ARIA attribute `aria-hasPopup`. ' +
          'Did you mean `aria-haspopup`?',
      );
    });

    it('should warn for use of recognized camel case aria attributes', () => {
      // The valid attribute name is aria-haspopup.
      expect(() => mountComponent({ariaHasPopup: 'true'})).toWarnDev(
        'Warning: Invalid ARIA attribute `ariaHasPopup`. ' +
          'Did you mean `aria-haspopup`?',
      );
    });

    it('should warn for use of unrecognized camel case aria attributes', () => {
      // The valid attribute name is aria-haspopup.
      expect(() => mountComponent({ariaSomethingInvalid: 'true'})).toWarnDev(
        'Warning: Invalid ARIA attribute `ariaSomethingInvalid`. ARIA ' +
          'attributes follow the pattern aria-* and must be lowercase.',
      );
    });
  });
});
