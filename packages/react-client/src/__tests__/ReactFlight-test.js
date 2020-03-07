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
let ReactNoopFlightServer;
let ReactNoopFlightClient;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
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
    let transport = ReactNoopFlightServer.render({
      foo: <Foo />,
    });
    let root = ReactNoopFlightClient.read(transport);
    let model = root.model;
    expect(model).toEqual({foo: {bar: ['A', 'B']}});
  });
});
