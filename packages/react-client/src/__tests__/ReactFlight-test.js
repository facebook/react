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

let act;
let React;
let ReactNoop;
let ReactNoopFlightServer;
let ReactNoopFlightClient;
let ErrorBoundary;
let NoErrorExpected;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
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

    NoErrorExpected = class extends React.Component {
      state = {hasError: false, error: null};
      static getDerivedStateFromError(error) {
        return {
          hasError: true,
          error,
        };
      }
      componentDidMount() {
        expect(this.state.error).toBe(null);
        expect(this.state.hasError).toBe(false);
      }
      render() {
        if (this.state.hasError) {
          return this.state.error.message;
        }
        return this.props.children;
      }
    };
  });

  function moduleReference(value) {
    return {
      $$typeof: Symbol.for('react.module.reference'),
      value: value,
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

  it('can render a client component using a module reference and render there', () => {
    function UserClient(props) {
      return (
        <span>
          {props.greeting}, {props.name}
        </span>
      );
    }
    const User = moduleReference(UserClient);

    function Greeting({firstName, lastName}) {
      return <User greeting="Hello" name={firstName + ' ' + lastName} />;
    }

    const model = {
      greeting: <Greeting firstName="Seb" lastName="Smith" />,
    };

    const transport = ReactNoopFlightServer.render(model);

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      const greeting = rootModel.greeting;
      ReactNoop.render(greeting);
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>Hello, Seb Smith</span>);
  });

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

    const ref = React.createRef();
    function RefProp() {
      return <div ref={ref} />;
    }

    const options = {
      onError() {
        // ignore
      },
    };
    const event = ReactNoopFlightServer.render(<EventHandlerProp />, options);
    const fn = ReactNoopFlightServer.render(<FunctionProp />, options);
    const symbol = ReactNoopFlightServer.render(<SymbolProp />, options);
    const refs = ReactNoopFlightServer.render(<RefProp />, options);

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
          <ErrorBoundary expectedMessage="Only global symbols received from Symbol.for(...) can be passed to client components.">
            <Client transport={symbol} />
          </ErrorBoundary>
          <ErrorBoundary expectedMessage="Refs cannot be used in server components, nor passed to client components.">
            <Client transport={refs} />
          </ErrorBoundary>
        </>,
      );
    });
  });

  it('should trigger the inner most error boundary inside a client component', () => {
    function ServerComponent() {
      throw new Error('This was thrown in the server component.');
    }

    function ClientComponent({children}) {
      // This should catch the error thrown by the server component, even though it has already happened.
      // We currently need to wrap it in a div because as it's set up right now, a lazy reference will
      // throw during reconciliation which will trigger the parent of the error boundary.
      // This is similar to how these will suspend the parent if it's a direct child of a Suspense boundary.
      // That's a bug.
      return (
        <ErrorBoundary expectedMessage="This was thrown in the server component.">
          <div>{children}</div>
        </ErrorBoundary>
      );
    }

    const ClientComponentReference = moduleReference(ClientComponent);

    function Server() {
      return (
        <ClientComponentReference>
          <ServerComponent />
        </ClientComponentReference>
      );
    }

    const data = ReactNoopFlightServer.render(<Server />, {
      onError(x) {
        // ignore
      },
    });

    function Client({transport}) {
      return ReactNoopFlightClient.read(transport);
    }

    act(() => {
      ReactNoop.render(
        <NoErrorExpected>
          <Client transport={data} />
        </NoErrorExpected>,
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

  it('should NOT warn in DEV for key getters', () => {
    const transport = ReactNoopFlightServer.render(<div key="a" />);
    act(() => {
      ReactNoop.render(ReactNoopFlightClient.read(transport));
    });
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
