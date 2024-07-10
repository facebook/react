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
let JSXDEVRuntime;
let waitForAll;

describe('ReactDeprecationWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    if (__DEV__) {
      JSXDEVRuntime = require('react/jsx-dev-runtime');
    }
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

  // @gate !disableStringRefs
  it('should warn when given string refs', async () => {
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
    await expect(async () => await waitForAll([])).toErrorDev(
      'Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-string-ref' +
        '\n    in RefComponent (at **)' +
        '\n    in Component (at **)',
    );
  });

  // Disabling this until #28732 lands so we can assert on the warning message.
  // (It's already disabled in all but the Meta builds, anyway. Nbd.)
  // @gate TODO || !__DEV__
  // @gate !disableStringRefs
  it('should warn when owner and self are the same for string refs', async () => {
    class RefComponent extends React.Component {
      render() {
        return null;
      }
    }
    class Component extends React.Component {
      render() {
        return React.createElement(RefComponent, {
          ref: 'refComponent',
          __self: this,
        });
      }
    }

    ReactNoop.render(<Component />);
    await expect(async () => await waitForAll([])).toErrorDev([
      'Component "Component" contains the string ref "refComponent". Support for string refs will be removed in a future major release.',
    ]);
    await waitForAll([]);
  });

  // Disabling this until #28732 lands so we can assert on the warning message.
  // (It's already disabled in all but the Meta builds, anyway. Nbd.)
  // @gate TODO || !__DEV__
  // @gate !disableStringRefs
  it('should warn when owner and self are different for string refs (createElement)', async () => {
    class RefComponent extends React.Component {
      render() {
        return null;
      }
    }
    class Component extends React.Component {
      render() {
        return React.createElement(RefComponent, {
          ref: 'refComponent',
          __self: {},
        });
      }
    }

    ReactNoop.render(<Component />);
    await expect(async () => await waitForAll([])).toErrorDev([
      'Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'This case cannot be automatically converted to an arrow function. ' +
        'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-string-ref',
    ]);
  });

  // @gate __DEV__
  // @gate !disableStringRefs
  it('should warn when owner and self are different for string refs (jsx)', async () => {
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
    await expect(async () => await waitForAll([])).toErrorDev([
      'Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'This case cannot be automatically converted to an arrow function. ' +
        'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-string-ref',
    ]);
  });
});
