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
let ReactDOM;

let ReactFeatureFlags = require('shared/ReactFeatureFlags');

// NOTE: We're explicitly not using JSX here. This is intended to test
// a new React.jsx api which does not have a JSX transformer yet.
// A lot of these tests are pulled from ReactElement-test because
// this api is meant to be backwards compatible.
describe('ReactElementJSXNewWarnings', () => {
  let originalSymbol;

  beforeEach(() => {
    jest.resetModules();

    // Delete the native Symbol if we have one to ensure we test the
    // unpolyfilled environment.
    originalSymbol = global.Symbol;
    global.Symbol = undefined;

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutSpreadingKeyToJSX = true;

    React = require('react');
    ReactDOM = require('react-dom');
  });

  afterEach(() => {
    global.Symbol = originalSymbol;
  });

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  it('should warn when keys are passed as part of props', () => {
    const container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return React.jsx('div', {});
      }
    }
    class Parent extends React.Component {
      render() {
        return React.jsx('div', {
          children: [React.jsx(Child, {key: '0'})],
        });
      }
    }
    expect(() => ReactDOM.render(React.jsx(Parent, {}), container)).toErrorDev(
      'Warning: React.jsx: Spreading a key to JSX is a deprecated pattern. ' +
        'Explicitly pass a key after spreading props in your JSX call. ' +
        'E.g. <Child {...props} key={key} />',
    );
  });
});
