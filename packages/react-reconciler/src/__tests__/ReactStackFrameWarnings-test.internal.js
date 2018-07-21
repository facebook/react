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

let React;
let ReactFeatureFlags;
let ReactNoop;

describe('ReactStackFrameWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('calls console.reactStack with warning frames if available', () => {
    function Foo() {
      return <div class="bar" />;
    }

    console.reactStack = () => {};
    spyOnDevAndProd(console, 'reactStack');

    ReactNoop.render(<Foo />);
    expect(console.reactStack).toHaveBeenCalledTimes(1); // doesnt work yet
    // expect(ReactNoop.flush).toWarnDev(
    //   'Warning: Stateless function components cannot be given refs. ' +
    //     'Attempts to access this ref will fail.\n\nCheck the render method ' +
    //     'of `Foo`.\n' +
    //     '    in FunctionalComponent (at **)\n' +
    //     '    in div (at **)\n' +
    //     '    in Foo (at **)',
    // );
    // expect(console.reactStack.calls.argsFor(0)[0].message).toEqual(
    //   ['mock frames', 'here', 'tbd'],
    // );
  });
});
