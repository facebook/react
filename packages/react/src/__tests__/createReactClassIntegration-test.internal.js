/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('create-react-class-integration', () => {
  describe('ReactNative NativeMethodsMixin', () => {
    let React;
    let ReactNative;
    let NativeMethodsMixin;
    let createReactClass;

    beforeEach(() => {
      jest.resetModules();

      React = require('react');

      createReactClass = require('create-react-class/factory')(
        React.Component,
        React.isValidElement,
        new React.Component().updater,
      );

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
