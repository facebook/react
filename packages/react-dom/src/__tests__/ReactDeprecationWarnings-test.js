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

  it('should warn when given defaultProps', async () => {
    function FunctionalComponent(props) {
      return null;
    }

    FunctionalComponent.defaultProps = {
      testProp: true,
    };

    ReactNoop.render(<FunctionalComponent />);
    await expect(async () => await waitForAll([])).toErrorDev(
      'Warning: FunctionalComponent: Support for defaultProps ' +
        'will be removed from function components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );
  });

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
      'Warning: FunctionalComponent: Support for defaultProps ' +
        'will be removed from memo components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );
  });

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
      'Warning: Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-string-ref' +
        '\n    in Component (at **)',
    );
  });

  it('should warn when owner and self are the same for string refs', async () => {
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
    expect(() => {
      ReactNoop.renderLegacySyncRoot(<Component />);
    }).toErrorDev([
      'Component "Component" contains the string ref "refComponent". Support for string refs will be removed in a future major release.',
    ]);
    await waitForAll([]);
  });

  it('should warn when owner and self are different for string refs', async () => {
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
    await expect(async () => await waitForAll([])).toErrorDev([
      'Warning: Component "Component" contains the string ref "refComponent". ' +
        'Support for string refs will be removed in a future major release. ' +
        'This case cannot be automatically converted to an arrow function. ' +
        'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-string-ref',
    ]);
  });

  if (__DEV__) {
    it('should warn when owner and self are different for string refs', async () => {
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
      await expect(async () => await waitForAll([])).toErrorDev(
        'Warning: Component "Component" contains the string ref "refComponent". ' +
          'Support for string refs will be removed in a future major release. ' +
          'This case cannot be automatically converted to an arrow function. ' +
          'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
          'Learn more about using refs safely here: ' +
          'https://reactjs.org/link/strict-mode-string-ref',
      );
    });
  }
});
