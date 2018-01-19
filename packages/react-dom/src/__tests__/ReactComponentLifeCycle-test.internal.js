/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactFeatureFlags;

describe('ReactComponentLifeCycle', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutDeprecatedLifecycles = true;

    React = require('react');
    ReactDOM = require('react-dom');
  });

  // TODO (RFC #6) Merge this back into ReactComponentLifeCycles-test once
  // the 'warnAboutDeprecatedLifecycles' feature flag has been removed.
  it('warns about deprecated unsafe lifecycles', function() {
    class MyComponent extends React.Component {
      componentWillMount() {}
      componentWillReceiveProps() {}
      componentWillUpdate() {}
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    expect(() => ReactDOM.render(<MyComponent x={1} />, container)).toWarnDev([
      'Warning: MyComponent: componentWillMount() is deprecated and will be ' +
        'removed in the next major version.',
    ]);

    expect(() => ReactDOM.render(<MyComponent x={2} />, container)).toWarnDev([
      'Warning: MyComponent: componentWillReceiveProps() is deprecated and ' +
        'will be removed in the next major version.',
      'Warning: MyComponent: componentWillUpdate() is deprecated and will be ' +
        'removed in the next major version.',
    ]);

    // Dedupe check (instantiate and update)
    ReactDOM.render(<MyComponent key="new" x={1} />, container);
    ReactDOM.render(<MyComponent key="new" x={2} />, container);
  });
});
