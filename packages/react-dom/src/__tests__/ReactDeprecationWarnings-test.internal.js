/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;

describe('ReactDeprecationWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ReactFeatureFlags.warnAboutDefaultPropsOnFunctionComponents = true;
  });

  afterEach(() => {
    ReactFeatureFlags.warnAboutDefaultPropsOnFunctionComponents = false;
  });

  it('should warn when given defaultProps', () => {
    function FunctionalComponent(props) {
      return null;
    }

    FunctionalComponent.defaultProps = {
      testProp: true,
    };

    ReactNoop.render(<FunctionalComponent />);
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev(
      'Warning: FunctionalComponent: Support for defaultProps ' +
        'will be removed from function components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );
  });
});
