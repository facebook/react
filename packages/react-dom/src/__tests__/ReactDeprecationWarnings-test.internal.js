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
let ReactNoop;
let Scheduler;
let JSXDEVRuntime;

describe('ReactDeprecationWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    if (__DEV__) {
      JSXDEVRuntime = require('react/jsx-dev-runtime');
    }
    ReactFeatureFlags.warnAboutDefaultPropsOnFunctionComponents = true;
    ReactFeatureFlags.warnAboutStringRefs = true;
  });

  afterEach(() => {
    ReactFeatureFlags.warnAboutDefaultPropsOnFunctionComponents = false;
    ReactFeatureFlags.warnAboutStringRefs = false;
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

  it('should warn when given string refs', () => {
    class RefComponent extends React.Component {
      render() {
        return null;
      }
    }
    class Component extends React.Component {
      render() {
        return <RefComponent ref="refComponent" />;
      }
    }

    ReactNoop.render(<Component />);
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev(
      'Warning: Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://fb.me/react-strict-mode-string-ref' +
        '\n    in Component (at **)',
    );
  });

  it('should not warn when owner and self are the same for string refs', () => {
    ReactFeatureFlags.warnAboutStringRefs = false;

    class RefComponent extends React.Component {
      render() {
        return null;
      }
    }
    class Component extends React.Component {
      render() {
        return <RefComponent ref="refComponent" __self={this} />;
      }
    }
    ReactNoop.renderLegacySyncRoot(<Component />);
    expect(Scheduler).toFlushWithoutYielding();
  });

  it('should warn when owner and self are different for string refs', () => {
    class RefComponent extends React.Component {
      render() {
        return null;
      }
    }
    class Component extends React.Component {
      render() {
        return <RefComponent ref="refComponent" __self={{}} />;
      }
    }

    ReactNoop.render(<Component />);
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev([
      'Warning: Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'This case cannot be automatically converted to an arrow function. ' +
        'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://fb.me/react-strict-mode-string-ref',
    ]);
  });

  if (__DEV__) {
    it('should warn when owner and self are different for string refs', () => {
      class RefComponent extends React.Component {
        render() {
          return null;
        }
      }
      class Component extends React.Component {
        render() {
          return JSXDEVRuntime.jsxDEV(
            RefComponent,
            {ref: 'refComponent'},
            null,
            false,
            {},
            {},
          );
        }
      }

      ReactNoop.render(<Component />);
      expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev(
        'Warning: Component "Component" contains the string ref "refComponent". ' +
          'Support for string refs will be removed in a future major release. ' +
          'This case cannot be automatically converted to an arrow function. ' +
          'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
          'Learn more about using refs safely here: ' +
          'https://fb.me/react-strict-mode-string-ref',
      );
    });
  }
});
