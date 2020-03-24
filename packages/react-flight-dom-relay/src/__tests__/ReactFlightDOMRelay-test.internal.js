/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let act;
let React;
let ReactDOM;
let ReactDOMFlightRelayServer;
let ReactDOMFlightRelayClient;

describe('ReactFlightDOMRelay', () => {
  beforeEach(() => {
    jest.resetModules();

    act = require('react-dom/test-utils').act;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFlightRelayServer = require('react-flight-dom-relay/server');
    ReactDOMFlightRelayClient = require('react-flight-dom-relay');
  });

  function readThrough(data) {
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
    return model;
  }

  function block(render, load) {
    return function(...args) {
      if (load === undefined) {
        return [Symbol.for('react.server.block'), render];
      }
      let curriedLoad = () => {
        return load(...args);
      };
      return [Symbol.for('react.server.block'), render, curriedLoad];
    };
  }

  it('can render a server component', () => {
    function Bar({text}) {
      return text.toUpperCase();
    }
    function Foo() {
      return {
        bar: (
          <div>
            <Bar text="a" />, <Bar text="b" />
          </div>
        ),
      };
    }
    let transport = [];
    ReactDOMFlightRelayServer.render(
      {
        foo: <Foo />,
      },
      transport,
    );

    let model = readThrough(transport);
    expect(model).toEqual({
      foo: {
        bar: (
          <div>
            {'A'}
            {', '}
            {'B'}
          </div>
        ),
      },
    });
  });

  it.experimental('can transfer a Block to the client and render there', () => {
    function load(firstName, lastName) {
      return {name: firstName + ' ' + lastName};
    }
    function User(props, data) {
      return (
        <span>
          {props.greeting}, {data.name}
        </span>
      );
    }
    let loadUser = block(User, load);
    let model = {
      User: loadUser('Seb', 'Smith'),
    };

    let transport = [];
    ReactDOMFlightRelayServer.render(model, transport);

    let modelClient = readThrough(transport);

    let container = document.createElement('div');
    let root = ReactDOM.createRoot(container);
    act(() => {
      let UserClient = modelClient.User;
      root.render(<UserClient greeting="Hello" />);
    });

    expect(container.innerHTML).toEqual('<span>Hello, Seb Smith</span>');
  });
});
