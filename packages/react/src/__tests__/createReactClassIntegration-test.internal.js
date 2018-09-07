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
let ReactFeatureFlags;
let createReactClass;

describe('create-react-class-integration', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutDeprecatedLifecycles = true;

    React = require('react');
    createReactClass = require('create-react-class/factory')(
      React.Component,
      React.isValidElement,
      new React.Component().updater,
    );
  });

  // TODO (RFC #6) Merge this back into createReactClassIntegration-test once
  // the 'warnAboutDeprecatedLifecycles' feature flag has been removed.
  it('isMounted works', () => {
    const ReactDOM = require('react-dom');

    const ops = [];
    let instance;
    const Component = createReactClass({
      displayName: 'MyComponent',
      mixins: [
        {
          UNSAFE_componentWillMount() {
            this.log('mixin.componentWillMount');
          },
          componentDidMount() {
            this.log('mixin.componentDidMount');
          },
          UNSAFE_componentWillUpdate() {
            this.log('mixin.componentWillUpdate');
          },
          componentDidUpdate() {
            this.log('mixin.componentDidUpdate');
          },
          componentWillUnmount() {
            this.log('mixin.componentWillUnmount');
          },
        },
      ],
      log(name) {
        ops.push(`${name}: ${this.isMounted()}`);
      },
      getInitialState() {
        this.log('getInitialState');
        return {};
      },
      UNSAFE_componentWillMount() {
        this.log('componentWillMount');
      },
      componentDidMount() {
        this.log('componentDidMount');
      },
      UNSAFE_componentWillUpdate() {
        this.log('componentWillUpdate');
      },
      componentDidUpdate() {
        this.log('componentDidUpdate');
      },
      componentWillUnmount() {
        this.log('componentWillUnmount');
      },
      render() {
        instance = this;
        this.log('render');
        return <div />;
      },
    });

    const container = document.createElement('div');

    expect(() => ReactDOM.render(<Component />, container)).toWarnDev(
      'Warning: MyComponent: isMounted is deprecated. Instead, make sure to ' +
        'clean up subscriptions and pending requests in componentWillUnmount ' +
        'to prevent memory leaks.',
      {withoutStack: true},
    );

    // Dedupe
    ReactDOM.render(<Component />, container);

    ReactDOM.unmountComponentAtNode(container);
    instance.log('after unmount');
    expect(ops).toEqual([
      'getInitialState: false',
      'mixin.componentWillMount: false',
      'componentWillMount: false',
      'render: false',
      'mixin.componentDidMount: true',
      'componentDidMount: true',
      'mixin.componentWillUpdate: true',
      'componentWillUpdate: true',
      'render: true',
      'mixin.componentDidUpdate: true',
      'componentDidUpdate: true',
      'mixin.componentWillUnmount: true',
      'componentWillUnmount: true',
      'after unmount: false',
    ]);
  });

  describe('ReactNative NativeMethodsMixin', () => {
    let ReactNative;
    let NativeMethodsMixin;

    beforeEach(() => {
      ReactNative = require('react-native-renderer');
      NativeMethodsMixin =
        ReactNative.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
          .NativeMethodsMixin;
    });

    it('should not warn about default DEV-only legacy lifecycle methods', () => {
      const View = createReactClass({
        mixins: [NativeMethodsMixin],
        render: () => null,
      });

      ReactNative.render(<View />, 1);
    });

    it('should warn if users specify their own legacy componentWillMount', () => {
      const View = createReactClass({
        displayName: 'MyNativeComponent',
        mixins: [NativeMethodsMixin],
        componentWillMount: () => {},
        render: () => null,
      });

      expect(() => ReactNative.render(<View />, 1)).toLowPriorityWarnDev(
        'componentWillMount is deprecated and will be removed in the next major version. ' +
          'Use componentDidMount instead. As a temporary workaround, ' +
          'you can rename to UNSAFE_componentWillMount.' +
          '\n\nPlease update the following components: MyNativeComponent',
        {withoutStack: true},
      );
    });

    it('should warn if users specify their own legacy componentWillReceiveProps', () => {
      const View = createReactClass({
        displayName: 'MyNativeComponent',
        mixins: [NativeMethodsMixin],
        componentWillReceiveProps: () => {},
        render: () => null,
      });

      expect(() => ReactNative.render(<View />, 1)).toLowPriorityWarnDev(
        'componentWillReceiveProps is deprecated and will be removed in the next major version. ' +
          'Use static getDerivedStateFromProps instead.' +
          '\n\nPlease update the following components: MyNativeComponent',
        {withoutStack: true},
      );
    });
  });
});
