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

describe('ReactFlightServer', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoopFlight = require('react-noop-renderer/flight-server');
  });

  it('can resolve a model', () => {
    function Bar({text}) {
      return text.toUpperCase();
    }
    function Foo() {
      return {
        bar: [<Bar text="a" />, <Bar text="b" />],
      };
    }
    let result = ReactNoopFlight.render({
      foo: <Foo />,
    });
    expect(result).toEqual([{foo: {bar: ['A', 'B']}}]);
  });
});
