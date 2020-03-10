/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

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
    let data = [];
    ReactDOMFlightRelayServer.render(
      {
        foo: <Foo />,
      },
      data,
    );

    let response = ReactDOMFlightRelayClient.createResponse();
    for (let i = 0; i < data.length; i++) {
      let chunk = data[i];
      if (chunk.type === 'json') {
        ReactDOMFlightRelayClient.resolveModel(response, chunk.id, chunk.json);
      } else {
        ReactDOMFlightRelayClient.resolveError(
          response,
          chunk.id,
          chunk.json.message,
          chunk.json.stack,
        );
      }
    }
    let model = ReactDOMFlightRelayClient.getModelRoot(response).model;
    ReactDOMFlightRelayClient.close(response);
    expect(model).toEqual({foo: {bar: ['A', 'B']}});
  });
});
