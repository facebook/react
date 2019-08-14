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

describe('ReactDeprecationWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toWarnDev(
      'Warning: FunctionalComponent: Support for defaultProps ' +
        'will be removed from function components in a future major ' +
        'release. Use JavaScript default parameters instead.',
      {withoutStack: true},
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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toWarnDev(
      'Warning: Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://fb.me/react-strict-mode-string-ref' +
        '\n    in Component (at **)',
    );
  });
});
