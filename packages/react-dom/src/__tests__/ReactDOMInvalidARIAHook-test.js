/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMInvalidARIAHook', () => {
  let React;
  let ReactDOMClient;
  let mountComponent;
  let act;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;

    mountComponent = async function (props) {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<div {...props} />);
      });
    };
  });

  describe('aria-* props', () => {
    it('should allow valid aria-* props', async () => {
      await mountComponent({'aria-label': 'Bumble bees'});
    });
    it('should warn for one invalid aria-* prop', async () => {
      await expect(() => mountComponent({'aria-badprop': 'maybe'})).toErrorDev(
        'Invalid aria prop `aria-badprop` on <div> tag. ' +
          'For details, see https://react.dev/link/invalid-aria-props',
      );
    });
    it('should warn for many invalid aria-* props', async () => {
      await expect(() =>
        mountComponent({
          'aria-badprop': 'Very tall trees',
          'aria-malprop': 'Turbulent seas',
        }),
      ).toErrorDev(
        'Invalid aria props `aria-badprop`, `aria-malprop` on <div> ' +
          'tag. For details, see https://react.dev/link/invalid-aria-props',
      );
    });
    it('should warn for an improperly cased aria-* prop', async () => {
      // The valid attribute name is aria-haspopup.
      await expect(() => mountComponent({'aria-hasPopup': 'true'})).toErrorDev(
        'Unknown ARIA attribute `aria-hasPopup`. ' +
          'Did you mean `aria-haspopup`?',
      );
    });

    it('should warn for use of recognized camel case aria attributes', async () => {
      // The valid attribute name is aria-haspopup.
      await expect(() => mountComponent({ariaHasPopup: 'true'})).toErrorDev(
        'Invalid ARIA attribute `ariaHasPopup`. ' +
          'Did you mean `aria-haspopup`?',
      );
    });

    it('should warn for use of unrecognized camel case aria attributes', async () => {
      // The valid attribute name is aria-haspopup.
      await expect(() =>
        mountComponent({ariaSomethingInvalid: 'true'}),
      ).toErrorDev(
        'Invalid ARIA attribute `ariaSomethingInvalid`. ARIA ' +
          'attributes follow the pattern aria-* and must be lowercase.',
      );
    });
  });
});
