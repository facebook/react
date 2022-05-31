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
let Scheduler;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = require('jest-react').act;
    Scheduler = require('scheduler');

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

  it('can render a lazy component as a shared component on the server', async () => {
    function SharedComponent({text}) {
      return (
        <div>
          shared<span>{text}</span>
        </div>
      );
    }

    let load = null;
    const loadSharedComponent = () => {
      return new Promise(res => {
        load = () => res({default: SharedComponent});
      });
    };

    const LazySharedComponent = React.lazy(loadSharedComponent);

    function ServerComponent() {
      return (
        <React.Suspense fallback={'Loading...'}>
          <LazySharedComponent text={'a'} />
        </React.Suspense>
      );
    }

    const transport = ReactNoopFlightServer.render(<ServerComponent />);

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    await load();

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        shared<span>a</span>
      </div>,
    );
  });

  it('errors on a Lazy element being used in Component position', async () => {
    function SharedComponent({text}) {
      return (
        <div>
          shared<span>{text}</span>
        </div>
      );
    }

    let load = null;

    const LazyElementDisguisedAsComponent = React.lazy(() => {
      return new Promise(res => {
        load = () => res({default: <SharedComponent text={'a'} />});
      });
    });

    function ServerComponent() {
      return (
        <React.Suspense fallback={'Loading...'}>
          <LazyElementDisguisedAsComponent text={'b'} />
        </React.Suspense>
      );
    }

    const transport = ReactNoopFlightServer.render(<ServerComponent />);

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    spyOnDevAndProd(console, 'error');
    await load();
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('can render a lazy element', async () => {
    function SharedComponent({text}) {
      return (
        <div>
          shared<span>{text}</span>
        </div>
      );
    }

    let load = null;

    const lazySharedElement = React.lazy(() => {
      return new Promise(res => {
        load = () => res({default: <SharedComponent text={'a'} />});
      });
    });

    function ServerComponent() {
      return (
        <React.Suspense fallback={'Loading...'}>
          {lazySharedElement}
        </React.Suspense>
      );
    }

    const transport = ReactNoopFlightServer.render(<ServerComponent />);

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    await load();

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        shared<span>a</span>
      </div>,
    );
  });

  it('errors with lazy value in element position that resolves to Component', async () => {
    function SharedComponent({text}) {
      return (
        <div>
          shared<span>{text}</span>
        </div>
      );
    }

    let load = null;

    const componentDisguisedAsElement = React.lazy(() => {
      return new Promise(res => {
        load = () => res({default: SharedComponent});
      });
    });

    function ServerComponent() {
      return (
        <React.Suspense fallback={'Loading...'}>
          {componentDisguisedAsElement}
        </React.Suspense>
      );
    }

    const transport = ReactNoopFlightServer.render(<ServerComponent />);

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    spyOnDevAndProd(console, 'error');
    await load();
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('can render a lazy module reference', async () => {
    function ClientComponent() {
      return <div>I am client</div>;
    }

    const ClientComponentReference = moduleReference(ClientComponent);

    let load = null;
    const loadClientComponentReference = () => {
      return new Promise(res => {
        load = () => res({default: ClientComponentReference});
      });
    };

    const LazyClientComponentReference = React.lazy(
      loadClientComponentReference,
    );

    function ServerComponent() {
      return (
        <React.Suspense fallback={'Loading...'}>
          <LazyClientComponentReference />
        </React.Suspense>
      );
    }

    const transport = ReactNoopFlightServer.render(<ServerComponent />);

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    await load();

    act(() => {
      const rootModel = ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput(<div>I am client</div>);
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

  describe('Hooks', () => {
    function DivWithId({children}) {
      const id = React.useId();
      return <div prop={id}>{children}</div>;
    }

    it('should support useId', () => {
      function App() {
        return (
          <>
            <DivWithId />
            <DivWithId />
          </>
        );
      }

      const transport = ReactNoopFlightServer.render(<App />);
      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <div prop=":S1:" />
          <div prop=":S2:" />
        </>,
      );
    });

    it('accepts an identifier prefix that prefixes generated ids', () => {
      function App() {
        return (
          <>
            <DivWithId />
            <DivWithId />
          </>
        );
      }

      const transport = ReactNoopFlightServer.render(<App />, {
        identifierPrefix: 'foo',
      });
      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <div prop=":fooS1:" />
          <div prop=":fooS2:" />
        </>,
      );
    });

    it('[TODO] it does not warn if you render a server element passed to a client module reference twice on the client when using useId', async () => {
      // @TODO Today if you render a server component with useId and pass it to a client component and that client component renders the element in two or more
      // places the id used on the server will be duplicated in the client. This is a deviation from the guarantees useId makes for Fizz/Client and is a consequence
      // of the fact that the server component is actually rendered on the server and is reduced to a set of host elements before being passed to the Client component
      // so the output passed to the Client has no knowledge of the useId use. In the future we would like to add a DEV warning when this happens. For now
      // we just accept that it is a nuance of useId in Flight
      function App() {
        const id = React.useId();
        const div = <div prop={id}>{id}</div>;
        return <ClientDoublerModuleRef el={div} />;
      }

      function ClientDoubler({el}) {
        Scheduler.unstable_yieldValue('ClientDoubler');
        return (
          <>
            {el}
            {el}
          </>
        );
      }

      const ClientDoublerModuleRef = moduleReference(ClientDoubler);

      const transport = ReactNoopFlightServer.render(<App />);
      expect(Scheduler).toHaveYielded([]);

      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });

      expect(Scheduler).toHaveYielded(['ClientDoubler']);
      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <div prop=":S1:">:S1:</div>
          <div prop=":S1:">:S1:</div>
        </>,
      );
    });
  });

  describe('ServerContext', () => {
    // @gate enableServerContext
    it('supports basic createServerContext usage', () => {
      const ServerContext = React.createServerContext(
        'ServerContext',
        'hello from server',
      );
      function Foo() {
        const context = React.useContext(ServerContext);
        return <div>{context}</div>;
      }

      const transport = ReactNoopFlightServer.render(<Foo />);
      act(() => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(<div>hello from server</div>);
    });

    // @gate enableServerContext
    it('propagates ServerContext providers in flight', () => {
      const ServerContext = React.createServerContext(
        'ServerContext',
        'default',
      );

      function Foo() {
        return (
          <div>
            <ServerContext.Provider value="hi this is server">
              <Bar />
            </ServerContext.Provider>
          </div>
        );
      }
      function Bar() {
        const context = React.useContext(ServerContext);
        return context;
      }

      const transport = ReactNoopFlightServer.render(<Foo />);
      act(() => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(<div>hi this is server</div>);
    });

    // @gate enableServerContext
    it('errors if you try passing JSX through ServerContext value', () => {
      const ServerContext = React.createServerContext('ServerContext', {
        foo: {
          bar: <span>hi this is default</span>,
        },
      });

      function Foo() {
        return (
          <div>
            <ServerContext.Provider
              value={{
                foo: {
                  bar: <span>hi this is server</span>,
                },
              }}>
              <Bar />
            </ServerContext.Provider>
          </div>
        );
      }
      function Bar() {
        const context = React.useContext(ServerContext);
        return context.foo.bar;
      }

      expect(() => {
        ReactNoopFlightServer.render(<Foo />);
      }).toErrorDev('React elements are not allowed in ServerContext', {
        withoutStack: true,
      });
    });

    // @gate enableServerContext
    it('propagates ServerContext and cleansup providers in flight', () => {
      const ServerContext = React.createServerContext(
        'ServerContext',
        'default',
      );

      function Foo() {
        return (
          <>
            <ServerContext.Provider value="hi this is server outer">
              <ServerContext.Provider value="hi this is server">
                <Bar />
              </ServerContext.Provider>
              <ServerContext.Provider value="hi this is server2">
                <Bar />
              </ServerContext.Provider>
              <Bar />
            </ServerContext.Provider>
            <ServerContext.Provider value="hi this is server outer2">
              <Bar />
            </ServerContext.Provider>
            <Bar />
          </>
        );
      }
      function Bar() {
        const context = React.useContext(ServerContext);
        return <span>{context}</span>;
      }

      const transport = ReactNoopFlightServer.render(<Foo />);
      act(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <span>hi this is server</span>
          <span>hi this is server2</span>
          <span>hi this is server outer</span>
          <span>hi this is server outer2</span>
          <span>default</span>
        </>,
      );
    });

    // @gate enableServerContext
    it('propagates ServerContext providers in flight after suspending', async () => {
      const ServerContext = React.createServerContext(
        'ServerContext',
        'default',
      );

      function Foo() {
        return (
          <div>
            <ServerContext.Provider value="hi this is server">
              <React.Suspense fallback={'Loading'}>
                <Bar />
              </React.Suspense>
            </ServerContext.Provider>
          </div>
        );
      }

      let resolve;
      const promise = new Promise(res => {
        resolve = () => {
          promise.unsuspend = true;
          res();
        };
      });

      function Bar() {
        if (!promise.unsuspend) {
          Scheduler.unstable_yieldValue('suspended');
          throw promise;
        }
        Scheduler.unstable_yieldValue('rendered');
        const context = React.useContext(ServerContext);
        return context;
      }

      const transport = ReactNoopFlightServer.render(<Foo />);

      expect(Scheduler).toHaveYielded(['suspended']);

      await act(async () => {
        resolve();
        await promise;
        jest.runAllImmediates();
      });

      expect(Scheduler).toHaveYielded(['rendered']);

      act(() => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(<div>hi this is server</div>);
    });

    // @gate enableServerContext
    it('serializes ServerContext to client', async () => {
      const ServerContext = React.createServerContext(
        'ServerContext',
        'default',
      );

      function ClientBar() {
        Scheduler.unstable_yieldValue('ClientBar');
        const context = React.useContext(ServerContext);
        return <span>{context}</span>;
      }

      const Bar = moduleReference(ClientBar);

      function Foo() {
        return (
          <ServerContext.Provider value="hi this is server">
            <Bar />
          </ServerContext.Provider>
        );
      }

      const model = {
        foo: <Foo />,
      };

      const transport = ReactNoopFlightServer.render(model);

      expect(Scheduler).toHaveYielded([]);

      act(() => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        const flightModel = ReactNoopFlightClient.read(transport);
        ReactNoop.render(flightModel.foo);
      });

      expect(Scheduler).toHaveYielded(['ClientBar']);
      expect(ReactNoop).toMatchRenderedOutput(<span>hi this is server</span>);

      expect(() => {
        React.createServerContext('ServerContext', 'default');
      }).toThrow('ServerContext: ServerContext already defined');
    });

    // @gate enableServerContext
    it('takes ServerContext from client for refetching usecases', async () => {
      const ServerContext = React.createServerContext(
        'ServerContext',
        'default',
      );
      function Bar() {
        return <span>{React.useContext(ServerContext)}</span>;
      }
      const transport = ReactNoopFlightServer.render(<Bar />, {
        context: [['ServerContext', 'Override']],
      });

      act(() => {
        const flightModel = ReactNoopFlightClient.read(transport);
        ReactNoop.render(flightModel);
      });
      expect(ReactNoop).toMatchRenderedOutput(<span>Override</span>);
    });

    // @gate enableServerContext
    it('sets default initial value when defined lazily on server or client', async () => {
      let ServerContext;
      function inlineLazyServerContextInitialization() {
        if (!ServerContext) {
          ServerContext = React.createServerContext('ServerContext', 'default');
        }
        return ServerContext;
      }

      let ClientContext;
      function inlineContextInitialization() {
        if (!ClientContext) {
          ClientContext = React.createServerContext('ServerContext', 'default');
        }
        return ClientContext;
      }

      function ClientBaz() {
        const context = inlineContextInitialization();
        const value = React.useContext(context);
        return <div>{value}</div>;
      }

      const Baz = moduleReference(ClientBaz);

      function Bar() {
        return (
          <article>
            <div>
              {React.useContext(inlineLazyServerContextInitialization())}
            </div>
            <Baz />
          </article>
        );
      }

      function ServerApp() {
        const Context = inlineLazyServerContextInitialization();
        return (
          <>
            <Context.Provider value="test">
              <Bar />
            </Context.Provider>
            <Bar />
          </>
        );
      }

      function ClientApp({serverModel}) {
        return (
          <>
            {serverModel}
            <ClientBaz />
          </>
        );
      }

      const transport = ReactNoopFlightServer.render(<ServerApp />);

      expect(ClientContext).toBe(undefined);

      // Reset all modules, except flight-modules which keeps the registry of client components
      const flightModules = require('react-noop-renderer/flight-modules');
      jest.resetModules();
      jest.mock('react-noop-renderer/flight-modules', () => flightModules);

      React = require('react');
      ReactNoop = require('react-noop-renderer');
      ReactNoopFlightServer = require('react-noop-renderer/flight-server');
      ReactNoopFlightClient = require('react-noop-renderer/flight-client');
      act = require('jest-react').act;
      Scheduler = require('scheduler');

      act(() => {
        const serverModel = ReactNoopFlightClient.read(transport);
        ReactNoop.render(<ClientApp serverModel={serverModel} />);
      });

      expect(ClientContext).not.toBe(ServerContext);

      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <article>
            <div>test</div>
            <div>test</div>
          </article>
          <article>
            <div>default</div>
            <div>default</div>
          </article>
          <div>default</div>
        </>,
      );
    });
  });
});
