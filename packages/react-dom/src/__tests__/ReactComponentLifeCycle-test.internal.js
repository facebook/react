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

  afterEach(() => {
    jest.resetModules();
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
    expect(() =>
      ReactDOM.render(<MyComponent x={1} />, container),
    ).toLowPriorityWarnDev(
      [
        'componentWillMount is deprecated and will be removed in the next major version. ' +
          'Use componentDidMount instead. As a temporary workaround, ' +
          'you can rename to UNSAFE_componentWillMount.' +
          '\n\nPlease update the following components: MyComponent',
        'componentWillReceiveProps is deprecated and will be removed in the next major version. ' +
          'Use static getDerivedStateFromProps instead.' +
          '\n\nPlease update the following components: MyComponent',
        'componentWillUpdate is deprecated and will be removed in the next major version. ' +
          'Use componentDidUpdate instead. As a temporary workaround, ' +
          'you can rename to UNSAFE_componentWillUpdate.' +
          '\n\nPlease update the following components: MyComponent',
      ],
      {withoutStack: true},
    );

    // Dedupe check (update and instantiate new
    ReactDOM.render(<MyComponent x={2} />, container);
    ReactDOM.render(<MyComponent key="new" x={1} />, container);
  });

  describe('react-lifecycles-compat', () => {
    const {polyfill} = require('react-lifecycles-compat');

    it('should not warn for components with polyfilled getDerivedStateFromProps', () => {
      class PolyfilledComponent extends React.Component {
        state = {};
        static getDerivedStateFromProps() {
          return null;
        }
        render() {
          return null;
        }
      }

      polyfill(PolyfilledComponent);

      const container = document.createElement('div');
      ReactDOM.render(
        <React.StrictMode>
          <PolyfilledComponent />
        </React.StrictMode>,
        container,
      );
    });

    it('should not warn for components with polyfilled getSnapshotBeforeUpdate', () => {
      class PolyfilledComponent extends React.Component {
        getSnapshotBeforeUpdate() {
          return null;
        }
        componentDidUpdate() {}
        render() {
          return null;
        }
      }

      polyfill(PolyfilledComponent);

      const container = document.createElement('div');
      ReactDOM.render(
        <React.StrictMode>
          <PolyfilledComponent />
        </React.StrictMode>,
        container,
      );
    });
  });
});
