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
let ReactNoop;

describe('ReactStackFrameWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('calls console.reactStack with warning frames if available', () => {
    function Foo() {
      return <div class="bar" />;
    }

    console.reactStack = () => {};
    spyOnDev(console, 'reactStack');

    ReactNoop.render(<Foo />);
    expect(console.reactStack).toHaveBeenCalledTimes(1); // doesnt work yet
    // // then check for the frames
    // expect(console.reactStack.calls.argsFor(0)[0].message).toEqual(
    //   ['mock frames', 'here', 'tbd'],
    // );
  });
});
