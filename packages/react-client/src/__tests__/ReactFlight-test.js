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
let ReactNoopFlightServerRuntime;
let ReactNoopFlightClient;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    ReactNoopFlightServerRuntime = require('react-noop-renderer/flight-server-runtime');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = ReactNoop.act;
  });

  function block(render, load) {
    if (load === undefined) {
      return () => {
        return ReactNoopFlightServerRuntime.serverBlockNoData(render);
      };
    }
    return function(...args) {
      const curriedLoad = () => {
        return load(...args);
      };
      return ReactNoopFlightServerRuntime.serverBlock(render, curriedLoad);
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
    const transport = ReactNoopFlightServer.render({
      foo: <Foo />,
    });
    const model = ReactNoopFlightClient.read(transport);
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
    it('can transfer a Block to the client and render there, without data', () => {
      function User(props, data) {
        return (
          <span>
            {props.greeting} {typeof data}
          </span>
        );
      }
      const loadUser = block(User);
      const model = {
        User: loadUser('Seb', 'Smith'),
      };

      const transport = ReactNoopFlightServer.render(model);

      act(() => {
        const rootModel = ReactNoopFlightClient.read(transport);
        const UserClient = rootModel.User;
        ReactNoop.render(<UserClient greeting="Hello" />);
      });

      expect(ReactNoop).toMatchRenderedOutput(<span>Hello undefined</span>);
    });

    it('can transfer a Block to the client and render there, with data', () => {
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
      const loadUser = block(User, load);
      const model = {
        User: loadUser('Seb', 'Smith'),
      };

      const transport = ReactNoopFlightServer.render(model);

      act(() => {
        const rootModel = ReactNoopFlightClient.read(transport);
        const UserClient = rootModel.User;
        ReactNoop.render(<UserClient greeting="Hello" />);
      });

      expect(ReactNoop).toMatchRenderedOutput(<span>Hello, Seb Smith</span>);
    });
  }
});
