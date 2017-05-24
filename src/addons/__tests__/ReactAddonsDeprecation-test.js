/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

const ReactWithAddons = require('ReactWithAddons');

const addonsDeprecationMessages = {
  CSSTransitionGroup: 'React.addons.CSSTransitionGroup has moved. ' +
    'Use react-transition-group/CSSTransitionGroup instead. ' +
    'Version 1.1.3 provides a drop-in replacement. ' +
    '(https://github.com/reactjs/react-transition-group)' +
    'See https://facebook.github.io/react/blog/#discontinuing-' +
    'support-for-react-addons for more details.',
  LinkedStateMixin: 'React.addons.LinkedStateMixin is deprecated. ' +
    'Explicitly set the value and onChange handler instead. ',
  PureRenderMixin: 'React.addons.PureRenderMixin is deprecated. ' +
    'Use React.PureComponent instead. ' +
    '(https://facebook.github.io/react/docs/react-api.html' +
    '#react.purecomponent)',
  TransitionGroup: 'React.addons.TransitionGroup has moved. ' +
    'Use react-transition-group/TransitionGroup instead. ' +
    'Version 1.1.3 provides a drop-in replacement. ' +
    '(https://github.com/reactjs/react-transition-group)',
  createFragment: 'React.addons.createFragment is deprecated. ' +
    'React 16 will have first-class support for fragments, at which ' +
    "point this package won't be necessary. " +
    'We recommend using arrays of keyed elements instead.',
  shallowCompare: 'React.addons.shallowCompare is no longer supported. ' +
    'Use React.PureComponent instead. ' +
    '(https://facebook.github.io/react/docs/react-api.html' +
    '#react.purecomponent)',
  update: 'React.addons.update is no longer supported. ' +
    'Use immutability-helper instead. ' +
    'Version 2.2.2 provides a drop-in replacement. ' +
    '(https://github.com/kolodny/immutability-helper)',
  TestUtils: 'React.addons.TestUtils has moved. ' +
    'Use react-dom/test-utils instead. ' +
    'See (https://facebook.github.io/react/blog/#react-test-utils) ' +
    'for more details.',
};

describe('React.addons', () => {
  it('should warn when you access any of the addons', () => {
    spyOn(console, 'warn');
    Object.keys(ReactWithAddons.addons, key => {
      const deprecationWarning = addonsDeprecationMessages[key];
      if (deprecationWarning) {
        // at least one addon has no warning
        ReactWithAddons.addons[key]; // access it to trigger warning
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn.calls.first().args[0]).toContain(
          addonsDeprecationMessages[key],
        );
        console.warn.calls.reset();
      }
    });
  });
});
