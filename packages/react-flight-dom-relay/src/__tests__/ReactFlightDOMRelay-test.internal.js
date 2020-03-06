/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Polyfills for test environment
global.TextDecoder = require('util').TextDecoder;

let React;
let ReactDOMFlightRelayServer;
let ReactDOMFlightRelayClient;

describe('ReactFlightDOMRelay', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMFlightRelayServer = require('react-flight-dom-relay/server');
    ReactDOMFlightRelayClient = require('react-flight-dom-relay');
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
    let data = ReactDOMFlightRelayServer.render({
      foo: <Foo />,
    });
    let root = ReactDOMFlightRelayClient.read(data);
    let model = root.model;
    expect(model).toEqual({foo: {bar: ['A', 'B']}});
  });
});
