/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactTestUtils;
let ReactFeatureFlags;

describe('ReactDeprecationWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactTestUtils = require('react-dom/test-utils');
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

    expect(() =>
      ReactTestUtils.renderIntoDocument(<FunctionalComponent />),
    ).toWarnDev(
      'Warning: FunctionalComponent: Function components will not support defaultProps. ' +
        'Use JavaScript default arguments instead.',
      {withoutStack: true},
    );
  });
});
