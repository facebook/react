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

describe('useState', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('ensure arity is correct', () => {
    expect(React.useState).toBeDefined();
    expect(React.useState.length).toBe(1);

    function Component() {
      const [, setState] = React.useState(() => 'Halo!');

      expect(setState.length).toBe(1);
      return null;
    }

    ReactNoop.render(<Component />);

  });
});
