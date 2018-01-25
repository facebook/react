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
let createReactClass;

describe('create-react-class-integration', () => {
  beforeEach(() => {
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutDeprecatedLifecycles = true;

    React = require('react');
    ReactDOM = require('react-dom');
    createReactClass = require('create-react-class/factory')(
      React.Component,
      React.isValidElement,
      new React.Component().updater,
    );
  });

  // TODO (RFC #6) Merge this back into createReactClassIntegration-test once
  // the 'warnAboutDeprecatedLifecycles' feature flag has been removed.
  it('isMounted works', () => {
    const ops = [];
    let instance;
    const Component = createReactClass({
      displayName: 'MyComponent',
      mixins: [
        {
          componentWillMount() {
            this.log('mixin.componentWillMount');
          },
          componentDidMount() {
            this.log('mixin.componentDidMount');
          },
          componentWillUpdate() {
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
      componentWillMount() {
        this.log('componentWillMount');
      },
      componentDidMount() {
        this.log('componentDidMount');
      },
      componentWillUpdate() {
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

    // TODO (RFC #6) The below lifecycle warnings are unavoidable for now,
    // Until create-react-class recognizes the UNSAFE_* methods.
    // (If we try to use them before them, it will error because
    // we are defining the same method twice.)
    // Update the above component to use the new UNSAFE_* methods
    // (and remove the expected warnings) once create-react-class has been updated.
    expect(() => ReactDOM.render(<Component />, container)).toWarnDev([
      'Warning: MyComponent: isMounted is deprecated. Instead, make sure to ' +
        'clean up subscriptions and pending requests in componentWillUnmount ' +
        'to prevent memory leaks.',
      'componentWillMount is deprecated and will be removed in the next major version. ' +
        'Use componentDidMount instead. As a temporary workaround, ' +
        'you can rename to UNSAFE_componentWillMount.' +
        '\n\nPlease update the following components: MyComponent',
      'componentWillUpdate is deprecated and will be removed in the next major version. ' +
        'Use componentDidUpdate instead. As a temporary workaround, ' +
        'you can rename to UNSAFE_componentWillUpdate.' +
        '\n\nPlease update the following components: MyComponent',
    ]);

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
});
