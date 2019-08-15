/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoopFlight;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoopFlight = require('react-noop-renderer/flight');
  });

  it('can call render', () => {
    let result = ReactNoopFlight.render(<div>hello world</div>);
    expect(result).toEqual([{type: 'div', props: {children: 'hello world'}}]);
  });
});
