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
let ReactNoop;
let waitForAll;

describe('ReactDeprecationWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
  });

  // @gate !disableDefaultPropsExceptForClasses || !__DEV__
  it('should warn when given defaultProps', async () => {
    function FunctionalComponent(props) {
      return null;
    }

    FunctionalComponent.defaultProps = {
      testProp: true,
    };

    ReactNoop.render(<FunctionalComponent />);
    await expect(async () => await waitForAll([])).toErrorDev(
      'FunctionalComponent: Support for defaultProps ' +
        'will be removed from function components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );
  });

  // @gate !disableDefaultPropsExceptForClasses || !__DEV__
  it('should warn when given defaultProps on a memoized function', async () => {
    const MemoComponent = React.memo(function FunctionalComponent(props) {
      return null;
    });

    MemoComponent.defaultProps = {
      testProp: true,
    };

    ReactNoop.render(
      <div>
        <MemoComponent />
      </div>,
    );
    await expect(async () => await waitForAll([])).toErrorDev(
      'FunctionalComponent: Support for defaultProps ' +
        'will be removed from memo components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );
  });
});
