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
let ErrorBoundary;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    ReactNoopFlightServerRuntime = require('react-noop-renderer/flight-server-runtime');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = ReactNoop.act;

    ErrorBoundary = class extends React.Component {
      state = {hasError: false, error: null};
      static getDerivedStateFromError(error) {
        return {
          hasError: true,
          error,
        };
      }
      componentDidMount() {
        expect(this.state.hasError).toBe(true);
        expect(this.state.error).toBeTruthy();
        expect(this.state.error.message).toContain(this.props.expectedMessage);
      }
      render() {
        if (this.state.hasError) {
          return this.state.error.message;
        }
        return this.props.children;
      }
    };
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

  it('should error if a non-serializable value is passed to a host component', () => {
    function EventHandlerProp() {
      return (
        <div className="foo" onClick={function() {}}>
          Test
        </div>
      );
    }
    function FunctionProp() {
      return <div>{() => {}}</div>;
    }
    function SymbolProp() {
      return <div foo={Symbol('foo')} />;
    }

    const event = ReactNoopFlightServer.render(<EventHandlerProp />);
    const fn = ReactNoopFlightServer.render(<FunctionProp />);
    const symbol = ReactNoopFlightServer.render(<SymbolProp />);

    function Client({transport}) {
      return ReactNoopFlightClient.read(transport);
    }

    act(() => {
      ReactNoop.render(
        <>
          <ErrorBoundary expectedMessage="Event handlers cannot be passed to client component props.">
            <Client transport={event} />
          </ErrorBoundary>
          <ErrorBoundary expectedMessage="Functions cannot be passed directly to client components because they're not serializable.">
            <Client transport={fn} />
          </ErrorBoundary>
          <ErrorBoundary expectedMessage="Symbol values (foo) cannot be passed to client components.">
            <Client transport={symbol} />
          </ErrorBoundary>
        </>,
      );
    });
  });

  it('should warn in DEV if a toJSON instance is passed to a host component', () => {
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <input value={new Date()} />,
      );
      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
    }).toErrorDev(
      'Only plain objects can be passed to client components from server components. ',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a special object is passed to a host component', () => {
    expect(() => {
      const transport = ReactNoopFlightServer.render(<input value={Math} />);
      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
    }).toErrorDev(
      'Only plain objects can be passed to client components from server components. ' +
        'Built-ins like Math are not supported.',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if an object with symbols is passed to a host component', () => {
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <input value={{[Symbol.iterator]: {}}} />,
      );
      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
    }).toErrorDev(
      'Only plain objects can be passed to client components from server components. ' +
        'Objects with symbol properties like Symbol.iterator are not supported.',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a class instance is passed to a host component', () => {
    class Foo {
      method() {}
    }
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <input value={new Foo()} />,
      );
      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
    }).toErrorDev(
      'Only plain objects can be passed to client components from server components. ',
      {withoutStack: true},
    );
  });
});
