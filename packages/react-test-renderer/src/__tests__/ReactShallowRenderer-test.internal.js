/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let createRenderer;
let React;
let ReactFeatureFlags;

describe('ReactShallowRenderer', () => {
  beforeEach(() => {
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutDeprecatedLifecycles = true;

    createRenderer = require('react-test-renderer/shallow').createRenderer;
    React = require('react');
  });

  afterEach(() => {
    jest.resetModules();
  });

  // TODO (RFC #6) Merge this back into ReactShallowRenderer-test once
  // the 'warnAboutDeprecatedLifecycles' feature flag has been removed.
  it('should warn if deprecated lifecycles exist', () => {
    class ComponentWithWarnings extends React.Component {
      componentWillReceiveProps() {}
      componentWillMount() {}
      componentWillUpdate() {}
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();
    expect(() =>
      shallowRenderer.render(<ComponentWithWarnings />),
    ).toLowPriorityWarnDev(
      'Warning: ComponentWithWarnings: componentWillMount() is deprecated and will ' +
        'be removed in the next major version.',
    );
    expect(() =>
      shallowRenderer.render(<ComponentWithWarnings />),
    ).toLowPriorityWarnDev([
      'Warning: ComponentWithWarnings: componentWillReceiveProps() is deprecated ' +
        'and will be removed in the next major version.',
      'Warning: ComponentWithWarnings: componentWillUpdate() is deprecated and will ' +
        'be removed in the next major version.',
    ]);

    // Verify no duplicate warnings
    shallowRenderer.render(<ComponentWithWarnings />);
  });

  describe('react-lifecycles-compat', () => {
    const polyfill = require('react-lifecycles-compat');

    it('should not warn about deprecated cWM/cWRP for polyfilled components', () => {
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

      const shallowRenderer = createRenderer();
      shallowRenderer.render(<PolyfilledComponent />);
    });
  });
});
