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

const ReactFeatureFlags = require('shared/ReactFeatureFlags');

let act;
let React;
let ReactNoop;
let ReactNoopFlightServer;
let ReactNoopFlightClient;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = ReactNoop.act;
  });

  function block(query, render) {
    return function(...args) {
      let curriedQuery = () => {
        return query(...args);
      };
      return [Symbol.for('react.server.block'), render, curriedQuery];
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
    let transport = ReactNoopFlightServer.render({
      foo: <Foo />,
    });
    let root = ReactNoopFlightClient.read(transport);
    let model = root.model;
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

  if (ReactFeatureFlags.enableBlocksAPI) {
    it('can transfer a Block to the client and render there', () => {
      function Query(firstName, lastName) {
        return {name: firstName + ' ' + lastName};
      }
      function User(props, data) {
        return (
          <span>
            {props.greeting}, {data.name}
          </span>
        );
      }
      let loadUser = block(Query, User);
      let model = {
        User: loadUser('Seb', 'Smith'),
      };

      let transport = ReactNoopFlightServer.render(model);
      let root = ReactNoopFlightClient.read(transport);

      act(() => {
        let UserClient = root.model.User;
        ReactNoop.render(<UserClient greeting="Hello" />);
      });

      expect(ReactNoop).toMatchRenderedOutput(<span>Hello, Seb Smith</span>);
    });
  }
});
