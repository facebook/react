/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let act;
let use;
let startTransition;
let React;
let ReactNoop;
let ReactNoopFlightServer;
let ReactNoopFlightClient;
let ErrorBoundary;
let NoErrorExpected;
let Scheduler;
let assertLog;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    startTransition = React.startTransition;
    use = React.use;
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = require('internal-test-utils').act;
    Scheduler = require('scheduler');
    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;

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
        if (__DEV__) {
          expect(this.state.error.message).toContain(
            this.props.expectedMessage,
          );
          expect(this.state.error.digest).toBe('a dev digest');
        } else {
          expect(this.state.error.message).toBe(
            'An error occurred in the Server Components render. The specific message is omitted in production' +
              ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
              ' may provide additional details about the nature of the error.',
          );
          expect(this.state.error.digest).toContain(this.props.expectedMessage);
          expect(this.state.error.stack).toBe(
            'Error: ' + this.state.error.message,
          );
        }
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function clientReference(value) {
    return Object.defineProperties(
      function () {
        throw new Error('Cannot call a client function from the server.');
      },
      {
        $$typeof: {value: Symbol.for('react.client.reference')},
        value: {value: value},
      },
    );
  }

  it('can render a Server Component', async () => {
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
    const model = await ReactNoopFlightClient.read(transport);
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

  it('can render a Client Component using a module reference and render there', async () => {
    function UserClient(props) {
      return (
        <span>
          {props.greeting}, {props.name}
        </span>
      );
    }
    const User = clientReference(UserClient);

    function Greeting({firstName, lastName}) {
      return <User greeting="Hello" name={firstName + ' ' + lastName} />;
    }

    const model = {
      greeting: <Greeting firstName="Seb" lastName="Smith" />,
    };

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      const greeting = rootModel.greeting;
      ReactNoop.render(greeting);
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>Hello, Seb Smith</span>);
  });

  it('can render an iterable as an array', async () => {
    function ItemListClient(props) {
      return <span>{props.items}</span>;
    }
    const ItemList = clientReference(ItemListClient);

    function Items() {
      const iterable = {
        [Symbol.iterator]: function* () {
          yield 'A';
          yield 'B';
          yield 'C';
        },
      };
      return <ItemList items={iterable} />;
    }

    const model = <Items />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>ABC</span>);
  });

  it('can render undefined', async () => {
    function Undefined() {
      return undefined;
    }

    const model = <Undefined />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(null);
  });

  // @gate FIXME
  it('should transport undefined object values', async () => {
    function ServerComponent(props) {
      return 'prop' in props
        ? `\`prop\` in props as '${props.prop}'`
        : '`prop` not in props';
    }
    const ClientComponent = clientReference(ServerComponent);

    const model = (
      <>
        <div>
          Server: <ServerComponent prop={undefined} />
        </div>
        <div>
          Client: <ClientComponent prop={undefined} />
        </div>
      </>
    );

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>Server: `prop` in props as 'undefined'</div>
        <div>Client: `prop` in props as 'undefined'</div>
      </>,
    );
  });

  it('can render an empty fragment', async () => {
    function Empty() {
      return <React.Fragment />;
    }

    const model = <Empty />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(null);
  });

  it('can transport BigInt', async () => {
    function ComponentClient({prop}) {
      return `prop: ${prop} (${typeof prop})`;
    }
    const Component = clientReference(ComponentClient);

    const model = <Component prop={90071992547409910000n} />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      'prop: 90071992547409910000 (bigint)',
    );
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

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    await load();

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
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

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    spyOnDevAndProd(console, 'error').mockImplementation(() => {});
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

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    await load();

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
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

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    spyOnDevAndProd(console, 'error').mockImplementation(() => {});
    await load();
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('can render a lazy module reference', async () => {
    function ClientComponent() {
      return <div>I am client</div>;
    }

    const ClientComponentReference = clientReference(ClientComponent);

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

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput('Loading...');
    await load();

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      ReactNoop.render(rootModel);
    });
    expect(ReactNoop).toMatchRenderedOutput(<div>I am client</div>);
  });

  // @gate enableUseHook
  it('should error if a non-serializable value is passed to a host component', async () => {
    function ClientImpl({children}) {
      return children;
    }
    const Client = clientReference(ClientImpl);

    function EventHandlerProp() {
      return (
        <div className="foo" onClick={function () {}}>
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

    function EventHandlerPropClient() {
      return (
        <Client className="foo" onClick={function () {}}>
          Test
        </Client>
      );
    }
    function FunctionPropClient() {
      return <Client>{() => {}}</Client>;
    }
    function SymbolPropClient() {
      return <Client foo={Symbol('foo')} />;
    }

    function RefPropClient() {
      return <Client ref={ref} />;
    }

    const options = {
      onError(x) {
        return __DEV__ ? 'a dev digest' : `digest("${x.message}")`;
      },
    };
    const event = ReactNoopFlightServer.render(<EventHandlerProp />, options);
    const fn = ReactNoopFlightServer.render(<FunctionProp />, options);
    const symbol = ReactNoopFlightServer.render(<SymbolProp />, options);
    const refs = ReactNoopFlightServer.render(<RefProp />, options);
    const eventClient = ReactNoopFlightServer.render(
      <EventHandlerPropClient />,
      options,
    );
    const fnClient = ReactNoopFlightServer.render(
      <FunctionPropClient />,
      options,
    );
    const symbolClient = ReactNoopFlightServer.render(
      <SymbolPropClient />,
      options,
    );
    const refsClient = ReactNoopFlightServer.render(<RefPropClient />, options);

    function Render({promise}) {
      return use(promise);
    }

    await act(() => {
      startTransition(() => {
        ReactNoop.render(
          <>
            <ErrorBoundary expectedMessage="Event handlers cannot be passed to Client Component props.">
              <Render promise={ReactNoopFlightClient.read(event)} />
            </ErrorBoundary>
            <ErrorBoundary
              expectedMessage={
                'Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".'
              }>
              <Render promise={ReactNoopFlightClient.read(fn)} />
            </ErrorBoundary>
            <ErrorBoundary expectedMessage="Only global symbols received from Symbol.for(...) can be passed to Client Components.">
              <Render promise={ReactNoopFlightClient.read(symbol)} />
            </ErrorBoundary>
            <ErrorBoundary expectedMessage="Refs cannot be used in Server Components, nor passed to Client Components.">
              <Render promise={ReactNoopFlightClient.read(refs)} />
            </ErrorBoundary>
            <ErrorBoundary expectedMessage="Event handlers cannot be passed to Client Component props.">
              <Render promise={ReactNoopFlightClient.read(eventClient)} />
            </ErrorBoundary>
            <ErrorBoundary
              expectedMessage={
                'Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".'
              }>
              <Render promise={ReactNoopFlightClient.read(fnClient)} />
            </ErrorBoundary>
            <ErrorBoundary expectedMessage="Only global symbols received from Symbol.for(...) can be passed to Client Components.">
              <Render promise={ReactNoopFlightClient.read(symbolClient)} />
            </ErrorBoundary>
            <ErrorBoundary expectedMessage="Refs cannot be used in Server Components, nor passed to Client Components.">
              <Render promise={ReactNoopFlightClient.read(refsClient)} />
            </ErrorBoundary>
          </>,
        );
      });
    });
  });

  // @gate enableUseHook
  it('should trigger the inner most error boundary inside a Client Component', async () => {
    function ServerComponent() {
      throw new Error('This was thrown in the Server Component.');
    }

    function ClientComponent({children}) {
      // This should catch the error thrown by the Server Component, even though it has already happened.
      // We currently need to wrap it in a div because as it's set up right now, a lazy reference will
      // throw during reconciliation which will trigger the parent of the error boundary.
      // This is similar to how these will suspend the parent if it's a direct child of a Suspense boundary.
      // That's a bug.
      return (
        <ErrorBoundary expectedMessage="This was thrown in the Server Component.">
          <div>{children}</div>
        </ErrorBoundary>
      );
    }

    const ClientComponentReference = clientReference(ClientComponent);

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

    function Client({promise}) {
      return use(promise);
    }

    await act(() => {
      startTransition(() => {
        ReactNoop.render(
          <NoErrorExpected>
            <Client promise={ReactNoopFlightClient.read(data)} />
          </NoErrorExpected>,
        );
      });
    });
  });

  it('should warn in DEV if a toJSON instance is passed to a host component', () => {
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <input value={new Date()} />,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Date objects are not supported.',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a toJSON instance is passed to a host component child', () => {
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <div>Current date: {new Date()}</div>,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Date objects cannot be rendered as text children. Try formatting it using toString().\n' +
        '  <div>Current date: {Date}</div>\n' +
        '                     ^^^^^^',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a special object is passed to a host component', () => {
    expect(() => {
      const transport = ReactNoopFlightServer.render(<input value={Math} />);
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Math objects are not supported.\n' +
        '  <input value={Math}>\n' +
        '               ^^^^^^',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if an object with symbols is passed to a host component', () => {
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <input value={{[Symbol.iterator]: {}}} />,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Objects with symbol properties like Symbol.iterator are not supported.',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a toJSON instance is passed to a Client Component', () => {
    function ClientImpl({value}) {
      return <div>{value}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <Client value={new Date()} />,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Date objects are not supported.',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a toJSON instance is passed to a Client Component child', () => {
    function ClientImpl({children}) {
      return <div>{children}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <Client>Current date: {new Date()}</Client>,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Date objects are not supported.\n' +
        '  <>Current date: {Date}</>\n' +
        '                  ^^^^^^',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a special object is passed to a Client Component', () => {
    function ClientImpl({value}) {
      return <div>{value}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(<Client value={Math} />);
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Math objects are not supported.\n' +
        '  <... value={Math}>\n' +
        '             ^^^^^^',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if an object with symbols is passed to a Client Component', () => {
    function ClientImpl({value}) {
      return <div>{value}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <Client value={{[Symbol.iterator]: {}}} />,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Objects with symbol properties like Symbol.iterator are not supported.',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a special object is passed to a nested object in Client Component', () => {
    function ClientImpl({value}) {
      return <div>{value}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <Client value={{hello: Math, title: <h1>hi</h1>}} />,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Math objects are not supported.\n' +
        '  {hello: Math, title: <h1/>}\n' +
        '          ^^^^',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a special object is passed to a nested array in Client Component', () => {
    function ClientImpl({value}) {
      return <div>{value}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <Client
          value={['looooong string takes up noise', Math, <h1>hi</h1>]}
        />,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Math objects are not supported.\n' +
        '  [..., Math, <h1/>]\n' +
        '        ^^^^',
      {withoutStack: true},
    );
  });

  it('should NOT warn in DEV for key getters', () => {
    const transport = ReactNoopFlightServer.render(<div key="a" />);
    ReactNoopFlightClient.read(transport);
  });

  it('should warn in DEV if a class instance is passed to a host component', () => {
    class Foo {
      method() {}
    }
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <input value={new Foo()} />,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a a client reference is passed to useContext()', () => {
    const Context = React.createContext();
    const ClientContext = clientReference(Context);
    function ServerComponent() {
      return React.useContext(ClientContext);
    }
    expect(() => {
      const transport = ReactNoopFlightServer.render(<ServerComponent />);
      ReactNoopFlightClient.read(transport);
    }).toErrorDev('Cannot read a Client Context from a Server Component.', {
      withoutStack: true,
    });
  });

  describe('Hooks', () => {
    function DivWithId({children}) {
      const id = React.useId();
      return <div prop={id}>{children}</div>;
    }

    it('should support useId', async () => {
      function App() {
        return (
          <>
            <DivWithId />
            <DivWithId />
          </>
        );
      }

      const transport = ReactNoopFlightServer.render(<App />);
      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });
      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <div prop=":S1:" />
          <div prop=":S2:" />
        </>,
      );
    });

    it('accepts an identifier prefix that prefixes generated ids', async () => {
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
      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });
      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <div prop=":fooS1:" />
          <div prop=":fooS2:" />
        </>,
      );
    });

    it('[TODO] it does not warn if you render a server element passed to a client module reference twice on the client when using useId', async () => {
      // @TODO Today if you render a Server Component with useId and pass it to a Client Component and that Client Component renders the element in two or more
      // places the id used on the server will be duplicated in the client. This is a deviation from the guarantees useId makes for Fizz/Client and is a consequence
      // of the fact that the Server Component is actually rendered on the server and is reduced to a set of host elements before being passed to the Client component
      // so the output passed to the Client has no knowledge of the useId use. In the future we would like to add a DEV warning when this happens. For now
      // we just accept that it is a nuance of useId in Flight
      function App() {
        const id = React.useId();
        const div = <div prop={id}>{id}</div>;
        return <ClientDoublerModuleRef el={div} />;
      }

      function ClientDoubler({el}) {
        Scheduler.log('ClientDoubler');
        return (
          <>
            {el}
            {el}
          </>
        );
      }

      const ClientDoublerModuleRef = clientReference(ClientDoubler);

      const transport = ReactNoopFlightServer.render(<App />);
      assertLog([]);

      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      assertLog(['ClientDoubler']);
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
    it('supports basic createServerContext usage', async () => {
      const ServerContext = React.createServerContext(
        'ServerContext',
        'hello from server',
      );
      function Foo() {
        const context = React.useContext(ServerContext);
        return <div>{context}</div>;
      }

      const transport = ReactNoopFlightServer.render(<Foo />);
      await act(async () => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(<div>hello from server</div>);
    });

    // @gate enableServerContext
    it('propagates ServerContext providers in flight', async () => {
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
      await act(async () => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
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
    it('propagates ServerContext and cleans up the providers in flight', async () => {
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
      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
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
          Scheduler.log('suspended');
          throw promise;
        }
        Scheduler.log('rendered');
        const context = React.useContext(ServerContext);
        return context;
      }

      const transport = ReactNoopFlightServer.render(<Foo />);

      assertLog(['suspended']);

      await act(async () => {
        resolve();
        await promise;
        jest.runAllImmediates();
      });

      assertLog(['rendered']);

      await act(async () => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
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
        Scheduler.log('ClientBar');
        const context = React.useContext(ServerContext);
        return <span>{context}</span>;
      }

      const Bar = clientReference(ClientBar);

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

      assertLog([]);

      await act(async () => {
        ServerContext._currentRenderer = null;
        ServerContext._currentRenderer2 = null;
        const flightModel = await ReactNoopFlightClient.read(transport);
        ReactNoop.render(flightModel.foo);
      });

      assertLog(['ClientBar']);
      expect(ReactNoop).toMatchRenderedOutput(<span>hi this is server</span>);

      expect(() => {
        React.createServerContext('ServerContext', 'default');
      }).toThrow('ServerContext: ServerContext already defined');
    });

    // @gate enableServerContext
    it('takes ServerContext from the client for refetching use cases', async () => {
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

      await act(async () => {
        const flightModel = await ReactNoopFlightClient.read(transport);
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

      const Baz = clientReference(ClientBaz);

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

      // Reset all modules, except flight-modules which keeps the registry of Client Components
      const flightModules = require('react-noop-renderer/flight-modules');
      jest.resetModules();
      jest.mock('react-noop-renderer/flight-modules', () => flightModules);

      React = require('react');
      ReactNoop = require('react-noop-renderer');
      ReactNoopFlightServer = require('react-noop-renderer/flight-server');
      ReactNoopFlightClient = require('react-noop-renderer/flight-client');
      act = require('internal-test-utils').act;
      Scheduler = require('scheduler');

      await act(async () => {
        const serverModel = await ReactNoopFlightClient.read(transport);
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
