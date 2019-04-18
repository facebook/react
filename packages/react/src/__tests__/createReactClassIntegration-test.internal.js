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
        'componentWillMount has been renamed to UNSAFE_componentWillMount, ' +
          "and the old name won't work in the next major version of React.\n" +
          'We suggest doing one of the following:\n' +
          '- If you initialize state in componentWillMount, move this logic into the constructor.\n' +
          '- If you fetch data or perform other side effects in componentWillMount, ' +
          'move this logic into componentDidMount.\n' +
          '- To rename all deprecated lifecycles to their new names, you can run ' +
          '`npx react-codemod rename-unsafe-lifecycles <path/to/code>` in your project folder. ' +
          '(Note that the warning will still be logged in strict mode.)\n' +
          '\nPlease update the following components: MyNativeComponent\n',
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
        'componentWillReceiveProps has been renamed to UNSAFE_componentWillReceiveProps, ' +
          "and the old name won't work in the next major version of React.\n" +
          'We suggest doing one of the following:\n' +
          "- If you're updating state whenever props change, " +
          'move this logic into static getDerivedStateFromProps.\n' +
          '- If you fetch data or perform other side effects in componentWillReceiveProps, ' +
          'move this logic into componentDidUpdate.\n' +
          '- Refactor your code to not use derived state at all, as described at ' +
          // todo - this should be an fb.me link
          'https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html.\n' +
          '- To rename all deprecated lifecycles to their new names, you can run ' +
          '`npx react-codemod rename-unsafe-lifecycles <path/to/code>` in your project folder. ' +
          '(Note that the warning will still be logged in strict mode.)\n' +
          '\nPlease update the following components: MyNativeComponent\n',
        {withoutStack: true},
      );
    });
  });
});
