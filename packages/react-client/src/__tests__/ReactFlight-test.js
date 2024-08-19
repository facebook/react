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

const path = require('path');

if (typeof Blob === 'undefined') {
  global.Blob = require('buffer').Blob;
}
if (typeof File === 'undefined' || typeof FormData === 'undefined') {
  global.File = require('undici').File;
  global.FormData = require('undici').FormData;
}

function normalizeCodeLocInfo(str) {
  return (
    str &&
    str.replace(/^ +(?:at|in) ([\S]+)[^\n]*/gm, function (m, name) {
      return '    in ' + name + (/\d/.test(m) ? ' (at **)' : '');
    })
  );
}

function formatV8Stack(stack) {
  let v8StyleStack = '';
  if (stack) {
    for (let i = 0; i < stack.length; i++) {
      const [name] = stack[i];
      if (v8StyleStack !== '') {
        v8StyleStack += '\n';
      }
      v8StyleStack += '    in ' + name + ' (at **)';
    }
  }
  return v8StyleStack;
}

const repoRoot = path.resolve(__dirname, '../../../../');
function normalizeReactCodeLocInfo(str) {
  const repoRootForRegexp = repoRoot.replace(/\//g, '\\/');
  const repoFileLocMatch = new RegExp(`${repoRootForRegexp}.+?:\\d+:\\d+`, 'g');
  return str && str.replace(repoFileLocMatch, '**');
}

// If we just use the original Error prototype, Jest will only display the error message if assertions fail.
// But we usually want to also assert on our expando properties or even the stack.
// By hiding the fact from Jest that this is an error, it will show all enumerable properties on mismatch.

function getErrorForJestMatcher(error) {
  return {
    ...error,
    // non-enumerable properties that are still relevant for testing
    message: error.message,
    stack: normalizeReactCodeLocInfo(error.stack),
  };
}

function normalizeComponentInfo(debugInfo) {
  if (Array.isArray(debugInfo.stack)) {
    const {debugTask, debugStack, ...copy} = debugInfo;
    copy.stack = formatV8Stack(debugInfo.stack);
    if (debugInfo.owner) {
      copy.owner = normalizeComponentInfo(debugInfo.owner);
    }
    return copy;
  } else {
    return debugInfo;
  }
}

function getDebugInfo(obj) {
  const debugInfo = obj._debugInfo;
  if (debugInfo) {
    const copy = [];
    for (let i = 0; i < debugInfo.length; i++) {
      copy.push(normalizeComponentInfo(debugInfo[i]));
    }
    return copy;
  }
  return debugInfo;
}

const heldValues = [];
let finalizationCallback;
function FinalizationRegistryMock(callback) {
  finalizationCallback = callback;
}
FinalizationRegistryMock.prototype.register = function (target, heldValue) {
  heldValues.push(heldValue);
};
global.FinalizationRegistry = FinalizationRegistryMock;

function gc() {
  for (let i = 0; i < heldValues.length; i++) {
    finalizationCallback(heldValues[i]);
  }
  heldValues.length = 0;
}

let act;
let use;
let startTransition;
let React;
let ReactServer;
let ReactNoop;
let ReactNoopFlightServer;
let ReactNoopFlightClient;
let ErrorBoundary;
let NoErrorExpected;
let Scheduler;
let assertLog;
let assertConsoleErrorDev;

describe('ReactFlight', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('react', () => require('react/react.react-server'));
    ReactServer = require('react');
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    // This stores the state so we need to preserve it
    const flightModules = require('react-noop-renderer/flight-modules');
    jest.resetModules();
    __unmockReact();
    jest.mock('react-noop-renderer/flight-modules', () => flightModules);
    React = require('react');
    startTransition = React.startTransition;
    use = React.use;
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = require('internal-test-utils').act;
    Scheduler = require('scheduler');
    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    assertConsoleErrorDev = InternalTestUtils.assertConsoleErrorDev;

    ErrorBoundary = class extends React.Component {
      state = {hasError: false, error: null};
      static getDerivedStateFromError(error) {
        return {
          hasError: true,
          error,
        };
      }
      componentDidCatch(error, errorInfo) {
        expect(error).toBe(this.state.error);
        if (this.props.expectedStack !== undefined) {
          expect(normalizeCodeLocInfo(errorInfo.componentStack)).toBe(
            this.props.expectedStack,
          );
        }
      }
      componentDidMount() {
        expect(this.state.hasError).toBe(true);
        expect(this.state.error).toBeTruthy();
        if (__DEV__) {
          expect(this.state.error.message).toContain(
            this.props.expectedMessage,
          );
          expect(this.state.error.digest).toBe('a dev digest');
          expect(this.state.error.environmentName).toBe(
            this.props.expectedEnviromentName || 'Server',
          );
          if (this.props.expectedErrorStack !== undefined) {
            expect(this.state.error.stack).toContain(
              this.props.expectedErrorStack,
            );
          }
        } else {
          expect(this.state.error.message).toBe(
            'An error occurred in the Server Components render. The specific message is omitted in production' +
              ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
              ' may provide additional details about the nature of the error.',
          );
          let expectedDigest = this.props.expectedMessage;
          if (
            expectedDigest.startsWith('{') ||
            expectedDigest.startsWith('<')
          ) {
            expectedDigest = '{}';
          } else if (expectedDigest.startsWith('[')) {
            expectedDigest = '[]';
          }
          expect(this.state.error.digest).toContain(expectedDigest);
          expect(this.state.error.environmentName).toBe(undefined);
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
      expect(getDebugInfo(greeting)).toEqual(
        __DEV__
          ? [
              {
                name: 'Greeting',
                env: 'Server',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      ReactNoop.render(greeting);
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>Hello, Seb Smith</span>);
  });

  it('can render a shared forwardRef Component', async () => {
    const Greeting = React.forwardRef(function Greeting(
      {firstName, lastName},
      ref,
    ) {
      return (
        <span ref={ref}>
          Hello, {firstName} {lastName}
        </span>
      );
    });

    const root = <Greeting firstName="Seb" lastName="Smith" />;

    const transport = ReactNoopFlightServer.render(root);

    await act(async () => {
      const promise = ReactNoopFlightClient.read(transport);
      expect(getDebugInfo(promise)).toEqual(
        __DEV__
          ? [
              {
                name: 'Greeting',
                env: 'Server',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      ReactNoop.render(await promise);
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

  it('can render an iterator as a single shot iterator', async () => {
    const iterator = (function* () {
      yield 'A';
      yield 'B';
      yield 'C';
    })();

    const transport = ReactNoopFlightServer.render(iterator);
    const result = await ReactNoopFlightClient.read(transport);

    // The iterator should be the same as itself.
    expect(result[Symbol.iterator]()).toBe(result);

    expect(Array.from(result)).toEqual(['A', 'B', 'C']);
    // We've already consumed this iterator.
    expect(Array.from(result)).toEqual([]);
  });

  it('can render a Generator Server Component as a fragment', async () => {
    function ItemListClient(props) {
      return <span>{props.children}</span>;
    }
    const ItemList = clientReference(ItemListClient);

    function* Items() {
      yield 'A';
      yield 'B';
      yield 'C';
    }

    const model = (
      <ItemList>
        <Items />
      </ItemList>
    );

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

  it('can transport weird numbers', async () => {
    const nums = [0, -0, Infinity, -Infinity, NaN];
    function ComponentClient({prop}) {
      expect(prop).not.toBe(nums);
      expect(prop).toEqual(nums);
      expect(prop.every((p, i) => Object.is(p, nums[i]))).toBe(true);
      return `prop: ${prop}`;
    }
    const Component = clientReference(ComponentClient);

    const model = <Component prop={nums} />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      // already checked -0 with expects above
      'prop: 0,0,Infinity,-Infinity,NaN',
    );
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

  it('can transport Date', async () => {
    function ComponentClient({prop}) {
      return `prop: ${prop.toISOString()}`;
    }
    const Component = clientReference(ComponentClient);

    const model = <Component prop={new Date(1234567890123)} />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput('prop: 2009-02-13T23:31:30.123Z');
  });

  it('can transport Map', async () => {
    function ComponentClient({prop, selected}) {
      return `
        map: ${prop instanceof Map}
        size: ${prop.size}
        greet: ${prop.get('hi').greet}
        content: ${JSON.stringify(Array.from(prop))}
        selected: ${prop.get(selected)}
      `;
    }
    const Component = clientReference(ComponentClient);

    const objKey = {obj: 'key'};
    const map = new Map([
      ['hi', {greet: 'world'}],
      [objKey, 123],
    ]);
    const model = <Component prop={map} selected={objKey} />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(`
        map: true
        size: 2
        greet: world
        content: [["hi",{"greet":"world"}],[{"obj":"key"},123]]
        selected: 123
      `);
  });

  it('can transport Set', async () => {
    function ComponentClient({prop, selected}) {
      return `
        set: ${prop instanceof Set}
        size: ${prop.size}
        hi: ${prop.has('hi')}
        content: ${JSON.stringify(Array.from(prop))}
        selected: ${prop.has(selected)}
      `;
    }
    const Component = clientReference(ComponentClient);

    const objKey = {obj: 'key'};
    const set = new Set(['hi', objKey]);
    const model = <Component prop={set} selected={objKey} />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(`
        set: true
        size: 2
        hi: true
        content: ["hi",{"obj":"key"}]
        selected: true
      `);
  });

  it('can transport FormData (no blobs)', async () => {
    function ComponentClient({prop}) {
      return `
        formData: ${prop instanceof FormData}
        hi: ${prop.get('hi')}
        multiple: ${prop.getAll('multiple')}
        content: ${JSON.stringify(Array.from(prop))}
      `;
    }
    const Component = clientReference(ComponentClient);

    const formData = new FormData();
    formData.append('hi', 'world');
    formData.append('multiple', 1);
    formData.append('multiple', 2);

    const model = <Component prop={formData} />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(`
        formData: true
        hi: world
        multiple: 1,2
        content: [["hi","world"],["multiple","1"],["multiple","2"]]
      `);
  });

  it('can transport cyclic objects', async () => {
    function ComponentClient({prop}) {
      expect(prop.obj.obj.obj).toBe(prop.obj.obj);
    }
    const Component = clientReference(ComponentClient);

    const cyclic = {obj: null};
    cyclic.obj = cyclic;
    const model = <Component prop={cyclic} />;

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });
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

    await load();

    await expect(async () => {
      await act(async () => {
        const rootModel = await ReactNoopFlightClient.read(transport);
        ReactNoop.render(rootModel);
      });
    }).rejects.toThrow(
      __DEV__
        ? 'Element type is invalid: expected a string (for built-in components) or a class/function ' +
            '(for composite components) but got: <div />. ' +
            'Did you accidentally export a JSX literal instead of a component?'
        : 'Element type is invalid: expected a string (for built-in components) or a class/function ' +
            '(for composite components) but got: object.',
    );
    expect(ReactNoop).toMatchRenderedOutput(null);
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
      return <div>{function fn() {}}</div>;
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
    function FunctionChildrenClient() {
      return <Client>{function Component() {}}</Client>;
    }
    function FunctionPropClient() {
      return <Client foo={() => {}} />;
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
    const fnChildrenClient = ReactNoopFlightServer.render(
      <FunctionChildrenClient />,
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
                __DEV__
                  ? 'Functions are not valid as a child of Client Components. This may happen if you return fn instead of <fn /> from render. Or maybe you meant to call this function rather than return it.'
                  : 'Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".'
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
                __DEV__
                  ? 'Functions are not valid as a child of Client Components. This may happen if you return Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.'
                  : 'Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".'
              }>
              <Render promise={ReactNoopFlightClient.read(fnChildrenClient)} />
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

  // @gate renameElementSymbol
  it('should emit descriptions of errors in dev', async () => {
    const ClientErrorBoundary = clientReference(ErrorBoundary);

    function Throw({value}) {
      throw value;
    }

    function RenderInlined() {
      const inlinedElement = {
        $$typeof: Symbol.for('react.element'),
        type: () => {},
        key: null,
        ref: null,
        props: {},
        _owner: null,
      };
      return inlinedElement;
    }

    // We wrap in lazy to ensure the errors throws lazily.
    const LazyInlined = React.lazy(async () => ({default: RenderInlined}));

    const testCases = (
      <>
        <ClientErrorBoundary expectedMessage="This is a real Error.">
          <Throw value={new TypeError('This is a real Error.')} />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage="This is a string error.">
          <Throw value="This is a string error." />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage="{message: ..., extra: ..., nested: ...}">
          <Throw
            value={{
              message: 'This is a long message',
              extra: 'properties',
              nested: {more: 'prop'},
            }}
          />
        </ClientErrorBoundary>
        <ClientErrorBoundary
          expectedMessage={'{message: "Short", extra: ..., nested: ...}'}>
          <Throw
            value={{
              message: 'Short',
              extra: 'properties',
              nested: {more: 'prop'},
            }}
          />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage="Symbol(hello)">
          <Throw value={Symbol('hello')} />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage="123">
          <Throw value={123} />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage="undefined">
          <Throw value={undefined} />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage="<div/>">
          <Throw value={<div />} />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage="function Foo() {}">
          <Throw value={function Foo() {}} />
        </ClientErrorBoundary>
        <ClientErrorBoundary expectedMessage={'["array"]'}>
          <Throw value={['array']} />
        </ClientErrorBoundary>
        <ClientErrorBoundary
          expectedMessage={
            'A React Element from an older version of React was rendered. ' +
            'This is not supported. It can happen if:\n' +
            '- Multiple copies of the "react" package is used.\n' +
            '- A library pre-bundled an old copy of "react" or "react/jsx-runtime".\n' +
            '- A compiler tries to "inline" JSX instead of using the runtime.'
          }>
          <LazyInlined />
        </ClientErrorBoundary>
      </>
    );

    const transport = ReactNoopFlightServer.render(testCases, {
      onError(x) {
        if (__DEV__) {
          return 'a dev digest';
        }
        if (x instanceof Error) {
          return `digest("${x.message}")`;
        } else if (Array.isArray(x)) {
          return `digest([])`;
        } else if (typeof x === 'object' && x !== null) {
          return `digest({})`;
        }
        return `digest(${String(x)})`;
      },
    });

    await act(() => {
      startTransition(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
    });
  });

  it('should include server components in error boundary stacks in dev', async () => {
    const ClientErrorBoundary = clientReference(ErrorBoundary);

    function Throw({value}) {
      throw value;
    }

    const expectedStack = __DEV__
      ? '\n    in Throw' +
        '\n    in div' +
        '\n    in ErrorBoundary (at **)' +
        '\n    in App'
      : '\n    in div' + '\n    in ErrorBoundary (at **)';

    function App() {
      return (
        <ClientErrorBoundary
          expectedMessage="This is a real Error."
          expectedStack={expectedStack}>
          <div>
            <Throw value={new TypeError('This is a real Error.')} />
          </div>
        </ClientErrorBoundary>
      );
    }

    const transport = ReactNoopFlightServer.render(<App />, {
      onError(x) {
        if (__DEV__) {
          return 'a dev digest';
        }
        if (x instanceof Error) {
          return `digest("${x.message}")`;
        } else if (Array.isArray(x)) {
          return `digest([])`;
        } else if (typeof x === 'object' && x !== null) {
          return `digest({})`;
        }
        return `digest(${String(x)})`;
      },
    });

    await act(() => {
      startTransition(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
    });
  });

  it('should handle serialization errors in element inside error boundary', async () => {
    const ClientErrorBoundary = clientReference(ErrorBoundary);

    const expectedStack = __DEV__
      ? '\n    in div' + '\n    in ErrorBoundary (at **)' + '\n    in App'
      : '\n    in ErrorBoundary (at **)';

    function App() {
      return (
        <ClientErrorBoundary
          expectedMessage="Event handlers cannot be passed to Client Component props."
          expectedStack={expectedStack}>
          <div onClick={function () {}} />
        </ClientErrorBoundary>
      );
    }

    const transport = ReactNoopFlightServer.render(<App />, {
      onError(x) {
        if (__DEV__) {
          return 'a dev digest';
        }
        if (x instanceof Error) {
          return `digest("${x.message}")`;
        } else if (Array.isArray(x)) {
          return `digest([])`;
        } else if (typeof x === 'object' && x !== null) {
          return `digest({})`;
        }
        return `digest(${String(x)})`;
      },
    });

    await act(() => {
      startTransition(() => {
        ReactNoop.render(ReactNoopFlightClient.read(transport));
      });
    });
  });

  it('should handle exotic stack frames', async () => {
    function ServerComponent() {
      const error = new Error('This is an error');
      const originalStackLines = error.stack.split('\n');
      // Fake a stack
      error.stack = [
        originalStackLines[0],
        // original
        // '    at ServerComponentError (file://~/react/packages/react-client/src/__tests__/ReactFlight-test.js:1166:19)',
        // nested eval (https://github.com/ChromeDevTools/devtools-frontend/blob/831be28facb4e85de5ee8c1acc4d98dfeda7a73b/test/unittests/front_end/panels/console/ErrorStackParser_test.ts#L198)
        '    at eval (eval at testFunction (inspected-page.html:29:11), <anonymous>:1:10)',
        // parens may be added by Webpack when bundle layers are used. They're also valid in directory names.
        '    at ServerComponentError (file://~/(some)(really)(exotic-directory)/ReactFlight-test.js:1166:19)',
        // anon function (https://github.com/ChromeDevTools/devtools-frontend/blob/831be28facb4e85de5ee8c1acc4d98dfeda7a73b/test/unittests/front_end/panels/console/ErrorStackParser_test.ts#L115C9-L115C35)
        '    at file:///testing.js:42:3',
        // async anon function (https://github.com/ChromeDevTools/devtools-frontend/blob/831be28facb4e85de5ee8c1acc4d98dfeda7a73b/test/unittests/front_end/panels/console/ErrorStackParser_test.ts#L130C9-L130C41)
        '    at async file:///testing.js:42:3',
        ...originalStackLines.slice(2),
      ].join('\n');
      throw error;
    }

    const findSourceMapURL = jest.fn(() => null);
    const errors = [];
    class MyErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      componentDidCatch(error, componentInfo) {
        errors.push(error);
      }
      render() {
        if (this.state.error) {
          return null;
        }
        return this.props.children;
      }
    }
    const ClientErrorBoundary = clientReference(MyErrorBoundary);

    function App() {
      return ReactServer.createElement(
        ClientErrorBoundary,
        null,
        ReactServer.createElement(ServerComponent),
      );
    }

    const transport = ReactNoopFlightServer.render(<App />, {
      onError(x) {
        if (__DEV__) {
          return 'a dev digest';
        }
        if (x instanceof Error) {
          return `digest("${x.message}")`;
        } else if (Array.isArray(x)) {
          return `digest([])`;
        } else if (typeof x === 'object' && x !== null) {
          return `digest({})`;
        }
        return `digest(${String(x)})`;
      },
    });

    await act(() => {
      startTransition(() => {
        ReactNoop.render(
          ReactNoopFlightClient.read(transport, {findSourceMapURL}),
        );
      });
    });

    if (__DEV__) {
      expect({
        errors: errors.map(getErrorForJestMatcher),
        findSourceMapURLCalls: findSourceMapURL.mock.calls,
      }).toEqual({
        errors: [
          {
            message: 'This is an error',
            stack: gate(flags => flags.enableOwnerStacks)
              ? expect.stringContaining(
                  'Error: This is an error\n' +
                    '    at eval (eval at testFunction (eval at createFakeFunction (**), <anonymous>:1:35)\n' +
                    '    at ServerComponentError (file://~/(some)(really)(exotic-directory)/ReactFlight-test.js:1166:19)\n' +
                    '    at <anonymous> (file:///testing.js:42:3)\n' +
                    '    at <anonymous> (file:///testing.js:42:3)\n',
                )
              : expect.stringContaining(
                  'Error: This is an error\n' +
                    '    at eval (eval at testFunction (inspected-page.html:29:11), <anonymous>:1:10)\n' +
                    '    at ServerComponentError (file://~/(some)(really)(exotic-directory)/ReactFlight-test.js:1166:19)\n' +
                    '    at file:///testing.js:42:3\n' +
                    '    at file:///testing.js:42:3',
                ),
            digest: 'a dev digest',
            environmentName: 'Server',
          },
        ],
        findSourceMapURLCalls: gate(flags => flags.enableOwnerStacks)
          ? [
              [__filename, 'Server'],
              [__filename, 'Server'],
              // TODO: What should we request here? The outer (<anonymous>) or the inner (inspected-page.html)?
              ['inspected-page.html:29:11), <anonymous>', 'Server'],
              [
                'file://~/(some)(really)(exotic-directory)/ReactFlight-test.js',
                'Server',
              ],
              ['file:///testing.js', 'Server'],
              [__filename, 'Server'],
            ]
          : [],
      });
    } else {
      expect(errors.map(getErrorForJestMatcher)).toEqual([
        {
          message:
            'An error occurred in the Server Components render. The specific message is omitted in production' +
            ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
            ' may provide additional details about the nature of the error.',
          stack:
            'Error: An error occurred in the Server Components render. The specific message is omitted in production' +
            ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
            ' may provide additional details about the nature of the error.',
          digest: 'digest("This is an error")',
        },
      ]);
    }
  });

  it('should include server components in warning stacks', async () => {
    function Component() {
      // Trigger key warning
      return <div>{[<span />]}</div>;
    }
    const ClientComponent = clientReference(Component);

    function Indirection({children}) {
      return children;
    }

    function App() {
      // We use the ReactServer runtime here to get the Server owner.
      return ReactServer.createElement(
        Indirection,
        null,
        ReactServer.createElement(ClientComponent),
      );
    }

    const transport = ReactNoopFlightServer.render(<App />);

    await expect(async () => {
      await act(() => {
        startTransition(() => {
          ReactNoop.render(ReactNoopFlightClient.read(transport));
        });
      });
    }).toErrorDev(
      'Each child in a list should have a unique "key" prop.\n' +
        '\n' +
        'Check the render method of `Component`. See https://react.dev/link/warning-keys for more information.\n' +
        '    in span (at **)\n' +
        '    in Component (at **)\n' +
        (gate(flags => flags.enableOwnerStacks)
          ? ''
          : '    in Indirection (at **)\n') +
        '    in App (at **)',
    );
  });

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
    const obj = {
      toJSON() {
        return 123;
      },
    };
    expect(() => {
      const transport = ReactNoopFlightServer.render(<input value={obj} />);
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Objects with toJSON methods are not supported. ' +
        'Convert it manually to a simple value before passing it to props.\n' +
        '  <input value={{toJSON: ...}}>\n' +
        '               ^^^^^^^^^^^^^^^',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a toJSON instance is passed to a host component child', () => {
    class MyError extends Error {
      toJSON() {
        return 123;
      }
    }
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <div>Womp womp: {new MyError('spaghetti')}</div>,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Error objects cannot be rendered as text children. Try formatting it using toString().\n' +
        '  <div>Womp womp: {Error}</div>\n' +
        '                  ^^^^^^^',
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
    const obj = {
      toJSON() {
        return 123;
      },
    };
    function ClientImpl({value}) {
      return <div>{value}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(<Client value={obj} />);
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Objects with toJSON methods are not supported.',
      {withoutStack: true},
    );
  });

  it('should warn in DEV if a toJSON instance is passed to a Client Component child', () => {
    const obj = {
      toJSON() {
        return 123;
      },
    };
    function ClientImpl({children}) {
      return <div>{children}</div>;
    }
    const Client = clientReference(ClientImpl);
    expect(() => {
      const transport = ReactNoopFlightServer.render(
        <Client>Current date: {obj}</Client>,
      );
      ReactNoopFlightClient.read(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ' +
        'Objects with toJSON methods are not supported. ' +
        'Convert it manually to a simple value before passing it to props.\n' +
        '  <>Current date: {{toJSON: ...}}</>\n' +
        '                  ^^^^^^^^^^^^^^^',
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

  it('should warn in DEV a child is missing keys on server component', () => {
    function NoKey({children}) {
      return ReactServer.createElement('div', {
        key: "this has a key but parent doesn't",
      });
    }
    expect(() => {
      // While we're on the server we need to have the Server version active to track component stacks.
      jest.resetModules();
      jest.mock('react', () => ReactServer);
      const transport = ReactNoopFlightServer.render(
        ReactServer.createElement(
          'div',
          null,
          Array(6).fill(ReactServer.createElement(NoKey)),
        ),
      );
      jest.resetModules();
      jest.mock('react', () => React);
      ReactNoopFlightClient.read(transport);
    }).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  // @gate !__DEV__ || enableOwnerStacks
  it('should warn in DEV a child is missing keys on a fragment', () => {
    expect(() => {
      // While we're on the server we need to have the Server version active to track component stacks.
      jest.resetModules();
      jest.mock('react', () => ReactServer);
      const transport = ReactNoopFlightServer.render(
        ReactServer.createElement(
          'div',
          null,
          Array(6).fill(ReactServer.createElement(ReactServer.Fragment)),
        ),
      );
      jest.resetModules();
      jest.mock('react', () => React);
      ReactNoopFlightClient.read(transport);
    }).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  it('should warn in DEV a child is missing keys in client component', async () => {
    function ParentClient({children}) {
      return children;
    }
    const Parent = clientReference(ParentClient);
    await expect(async () => {
      const transport = ReactNoopFlightServer.render(
        <Parent>{Array(6).fill(<div>no key</div>)}</Parent>,
      );
      ReactNoopFlightClient.read(transport);
      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });
    }).toErrorDev(
      gate(flags => flags.enableOwnerStacks)
        ? 'Each child in a list should have a unique "key" prop.' +
            '\n\nCheck the top-level render call using <ParentClient>. ' +
            'See https://react.dev/link/warning-keys for more information.'
        : 'Each child in a list should have a unique "key" prop. ' +
            'See https://react.dev/link/warning-keys for more information.',
    );
  });

  it('should error if a class instance is passed to a host component', () => {
    class Foo {
      method() {}
    }
    const errors = [];
    ReactNoopFlightServer.render(<input value={new Foo()} />, {
      onError(x) {
        errors.push(x.message);
      },
    });

    expect(errors).toEqual([
      'Only plain objects, and a few built-ins, can be passed to Client Components ' +
        'from Server Components. Classes or null prototypes are not supported.' +
        (__DEV__
          ? '\n' + '  <input value={{}}>\n' + '               ^^^^'
          : '\n' + '  {value: {}}\n' + '          ^^'),
    ]);
  });

  it('should error if useContext is called()', () => {
    function ServerComponent() {
      return ReactServer.useContext();
    }
    const errors = [];
    ReactNoopFlightServer.render(<ServerComponent />, {
      onError(x) {
        errors.push(x.message);
      },
    });
    expect(errors).toEqual(['ReactServer.useContext is not a function']);
  });

  it('should error if a context without a client reference is passed to use()', () => {
    const Context = React.createContext();
    function ServerComponent() {
      return ReactServer.use(Context);
    }
    const errors = [];
    ReactNoopFlightServer.render(<ServerComponent />, {
      onError(x) {
        errors.push(x.message);
      },
    });
    expect(errors).toEqual([
      'Cannot read a Client Context from a Server Component.',
    ]);
  });

  it('should error if a client reference is passed to use()', () => {
    const Context = React.createContext();
    const ClientContext = clientReference(Context);
    function ServerComponent() {
      return ReactServer.use(ClientContext);
    }
    const errors = [];
    ReactNoopFlightServer.render(<ServerComponent />, {
      onError(x) {
        errors.push(x.message);
      },
    });
    expect(errors).toEqual([
      'Cannot read a Client Context from a Server Component.',
    ]);
  });

  describe('Hooks', () => {
    function DivWithId({children}) {
      const id = ReactServer.useId();
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
        const id = ReactServer.useId();
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

  // @gate enableTaint
  it('errors when a tainted object is serialized', async () => {
    function UserClient({user}) {
      return <span>{user.name}</span>;
    }
    const User = clientReference(UserClient);

    const user = {
      name: 'Seb',
      age: 'rather not say',
    };
    ReactServer.experimental_taintObjectReference(
      "Don't pass the raw user object to the client",
      user,
    );
    const errors = [];
    ReactNoopFlightServer.render(<User user={user} />, {
      onError(x) {
        errors.push(x.message);
      },
    });

    expect(errors).toEqual(["Don't pass the raw user object to the client"]);
  });

  // @gate enableTaint
  it('errors with a specific message when a tainted function is serialized', async () => {
    function UserClient({user}) {
      return <span>{user.name}</span>;
    }
    const User = clientReference(UserClient);

    function change() {}
    ReactServer.experimental_taintObjectReference(
      'A change handler cannot be passed to a client component',
      change,
    );
    const errors = [];
    ReactNoopFlightServer.render(<User onChange={change} />, {
      onError(x) {
        errors.push(x.message);
      },
    });

    expect(errors).toEqual([
      'A change handler cannot be passed to a client component',
    ]);
  });

  // @gate enableTaint
  it('errors when a tainted string is serialized', async () => {
    function UserClient({user}) {
      return <span>{user.name}</span>;
    }
    const User = clientReference(UserClient);

    const process = {
      env: {
        SECRET: '3e971ecc1485fe78625598bf9b6f85db',
      },
    };
    ReactServer.experimental_taintUniqueValue(
      'Cannot pass a secret token to the client',
      process,
      process.env.SECRET,
    );

    const errors = [];
    ReactNoopFlightServer.render(<User token={process.env.SECRET} />, {
      onError(x) {
        errors.push(x.message);
      },
    });

    expect(errors).toEqual(['Cannot pass a secret token to the client']);

    // This just ensures the process object is kept alive for the life time of
    // the test since we're simulating a global as an example.
    expect(process.env.SECRET).toBe('3e971ecc1485fe78625598bf9b6f85db');
  });

  // @gate enableTaint
  it('errors when a tainted bigint is serialized', async () => {
    function UserClient({user}) {
      return <span>{user.name}</span>;
    }
    const User = clientReference(UserClient);

    const currentUser = {
      name: 'Seb',
      token: BigInt('0x3e971ecc1485fe78625598bf9b6f85dc'),
    };
    ReactServer.experimental_taintUniqueValue(
      'Cannot pass a secret token to the client',
      currentUser,
      currentUser.token,
    );

    function App({user}) {
      return <User token={user.token} />;
    }

    const errors = [];
    ReactNoopFlightServer.render(<App user={currentUser} />, {
      onError(x) {
        errors.push(x.message);
      },
    });

    expect(errors).toEqual(['Cannot pass a secret token to the client']);
  });

  // @gate enableTaint && enableBinaryFlight
  it('errors when a tainted binary value is serialized', async () => {
    function UserClient({user}) {
      return <span>{user.name}</span>;
    }
    const User = clientReference(UserClient);

    const currentUser = {
      name: 'Seb',
      token: new Uint32Array([0x3e971ecc, 0x1485fe78, 0x625598bf, 0x9b6f85dd]),
    };
    ReactServer.experimental_taintUniqueValue(
      'Cannot pass a secret token to the client',
      currentUser,
      currentUser.token,
    );

    function App({user}) {
      const clone = user.token.slice();
      return <User token={clone} />;
    }

    const errors = [];
    ReactNoopFlightServer.render(<App user={currentUser} />, {
      onError(x) {
        errors.push(x.message);
      },
    });

    expect(errors).toEqual(['Cannot pass a secret token to the client']);
  });

  // @gate enableTaint
  it('keep a tainted value tainted until the end of any pending requests', async () => {
    function UserClient({user}) {
      return <span>{user.name}</span>;
    }
    const User = clientReference(UserClient);

    function getUser() {
      const user = {
        name: 'Seb',
        token: '3e971ecc1485fe78625598bf9b6f85db',
      };
      ReactServer.experimental_taintUniqueValue(
        'Cannot pass a secret token to the client',
        user,
        user.token,
      );
      return user;
    }

    function App() {
      const user = getUser();
      const derivedValue = {...user};
      // A garbage collection can happen at any time. Even before the end of
      // this request. This would clean up the user object.
      gc();
      // We should still block the tainted value.
      return <User user={derivedValue} />;
    }

    let errors = [];
    ReactNoopFlightServer.render(<App />, {
      onError(x) {
        errors.push(x.message);
      },
    });

    expect(errors).toEqual(['Cannot pass a secret token to the client']);

    // After the previous requests finishes, the token can be rendered again.

    errors = [];
    ReactNoopFlightServer.render(
      <User user={{token: '3e971ecc1485fe78625598bf9b6f85db'}} />,
      {
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    expect(errors).toEqual([]);
  });

  it('preserves state when keying a server component', async () => {
    function StatefulClient({name}) {
      const [state] = React.useState(name.toLowerCase());
      return state;
    }
    const Stateful = clientReference(StatefulClient);

    function Item({item}) {
      return (
        <div>
          {item}
          <Stateful name={item} />
        </div>
      );
    }

    function Items({items}) {
      return items.map(item => {
        return <Item key={item} item={item} />;
      });
    }

    const transport = ReactNoopFlightServer.render(
      <Items items={['A', 'B', 'C']} />,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>Aa</div>
        <div>Bb</div>
        <div>Cc</div>
      </>,
    );

    const transport2 = ReactNoopFlightServer.render(
      <Items items={['B', 'A', 'D', 'C']} />,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport2));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>Bb</div>
        <div>Aa</div>
        <div>Dd</div>
        <div>Cc</div>
      </>,
    );
  });

  it('does not inherit keys of children inside a server component', async () => {
    function StatefulClient({name, initial}) {
      const [state] = React.useState(initial);
      return state;
    }
    const Stateful = clientReference(StatefulClient);

    function Item({item, initial}) {
      // This key is the key of the single item of this component.
      // It's NOT part of the key of the list the parent component is
      // in.
      return (
        <div key={item}>
          {item}
          <Stateful name={item} initial={initial} />
        </div>
      );
    }

    function IndirectItem({item, initial}) {
      // Even though we render two items with the same child key this key
      // should not conflict, because the key belongs to the parent slot.
      return <Item key="parent" item={item} initial={initial} />;
    }

    // These items don't have their own keys because they're in a fixed set
    const transport = ReactNoopFlightServer.render(
      <>
        <Item item="A" initial={1} />
        <Item item="B" initial={2} />
        <IndirectItem item="C" initial={5} />
        <IndirectItem item="C" initial={6} />
      </>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>A1</div>
        <div>B2</div>
        <div>C5</div>
        <div>C6</div>
      </>,
    );

    // This means that they shouldn't swap state when the properties update
    const transport2 = ReactNoopFlightServer.render(
      <>
        <Item item="B" initial={3} />
        <Item item="A" initial={4} />
        <IndirectItem item="C" initial={7} />
        <IndirectItem item="C" initial={8} />
      </>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport2));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>B3</div>
        <div>A4</div>
        <div>C5</div>
        <div>C6</div>
      </>,
    );
  });

  it('shares state between single return and array return in a parent', async () => {
    function StatefulClient({name, initial}) {
      const [state] = React.useState(initial);
      return state;
    }
    const Stateful = clientReference(StatefulClient);

    function Item({item, initial}) {
      // This key is the key of the single item of this component.
      // It's NOT part of the key of the list the parent component is
      // in.
      return (
        <span key={item}>
          {item}
          <Stateful name={item} initial={initial} />
        </span>
      );
    }

    function Condition({condition}) {
      if (condition) {
        return <Item item="A" initial={1} />;
      }
      // The first item in the fragment is the same as the single item.
      return (
        <>
          <Item item="A" initial={2} />
          <Item item="B" initial={3} />
        </>
      );
    }

    function ConditionPlain({condition}) {
      if (condition) {
        return (
          <span>
            C
            <Stateful name="C" initial={1} />
          </span>
        );
      }
      // The first item in the fragment is the same as the single item.
      return (
        <>
          <span>
            C
            <Stateful name="C" initial={2} />
          </span>
          <span>
            D
            <Stateful name="D" initial={3} />
          </span>
        </>
      );
    }

    const transport = ReactNoopFlightServer.render(
      // This two item wrapper ensures we're already one step inside an array.
      // A single item is not the same as a set when it's nested one level.
      <>
        <div>
          <Condition condition={true} />
        </div>
        <div>
          <ConditionPlain condition={true} />
        </div>
        <div key="keyed">
          <ConditionPlain condition={true} />
        </div>
      </>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>
          <span>A1</span>
        </div>
        <div>
          <span>C1</span>
        </div>
        <div>
          <span>C1</span>
        </div>
      </>,
    );

    const transport2 = ReactNoopFlightServer.render(
      <>
        <div>
          <Condition condition={false} />
        </div>
        <div>
          <ConditionPlain condition={false} />
        </div>
        {null}
        <div key="keyed">
          <ConditionPlain condition={false} />
        </div>
      </>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport2));
    });

    // We're intentionally breaking from the semantics here for efficiency of the protocol.
    // In the case a Server Component inside a fragment is itself implicitly keyed but its
    // return value has a key, then we need a wrapper fragment. This means they can't
    // reconcile. To solve this we would need to add a wrapper fragment to every Server
    // Component just in case it returns a fragment later which is a lot.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>
          <span>A2{/* This should be A1 ideally */}</span>
          <span>B3</span>
        </div>
        <div>
          <span>C1</span>
          <span>D3</span>
        </div>
        <div>
          <span>C1</span>
          <span>D3</span>
        </div>
      </>,
    );
  });

  it('shares state between single return and array return in a set', async () => {
    function StatefulClient({name, initial}) {
      const [state] = React.useState(initial);
      return state;
    }
    const Stateful = clientReference(StatefulClient);

    function Item({item, initial}) {
      // This key is the key of the single item of this component.
      // It's NOT part of the key of the list the parent component is
      // in.
      return (
        <span key={item}>
          {item}
          <Stateful name={item} initial={initial} />
        </span>
      );
    }

    function Condition({condition}) {
      if (condition) {
        return <Item item="A" initial={1} />;
      }
      // The first item in the fragment is the same as the single item.
      return (
        <>
          <Item item="A" initial={2} />
          <Item item="B" initial={3} />
        </>
      );
    }

    function ConditionPlain({condition}) {
      if (condition) {
        return (
          <span>
            C
            <Stateful name="C" initial={1} />
          </span>
        );
      }
      // The first item in the fragment is the same as the single item.
      return (
        <>
          <span>
            C
            <Stateful name="C" initial={2} />
          </span>
          <span>
            D
            <Stateful name="D" initial={3} />
          </span>
        </>
      );
    }

    const transport = ReactNoopFlightServer.render(
      // This two item wrapper ensures we're already one step inside an array.
      // A single item is not the same as a set when it's nested one level.
      <div>
        <Condition condition={true} />
        <ConditionPlain condition={true} />
        <ConditionPlain key="keyed" condition={true} />
      </div>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>A1</span>
        <span>C1</span>
        <span>C1</span>
      </div>,
    );

    const transport2 = ReactNoopFlightServer.render(
      <div>
        <Condition condition={false} />
        <ConditionPlain condition={false} />
        {null}
        <ConditionPlain key="keyed" condition={false} />
      </div>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport2));
    });

    // We're intentionally breaking from the semantics here for efficiency of the protocol.
    // The issue with this test scenario is that when the Server Component is in a set,
    // the next slot can't be conditionally a fragment or single. That would require wrapping
    // in an additional fragment for every single child just in case it every expands to a
    // fragment.
    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>A2{/* Should be A1 */}</span>
        <span>B3</span>
        <span>C2{/* Should be C1 */}</span>
        <span>D3</span>
        <span>C2{/* Should be C1 */}</span>
        <span>D3</span>
      </div>,
    );
  });

  it('preserves state with keys split across async work', async () => {
    let resolve;
    const promise = new Promise(r => (resolve = r));

    function StatefulClient({name}) {
      const [state] = React.useState(name.toLowerCase());
      return state;
    }
    const Stateful = clientReference(StatefulClient);

    function Item({name}) {
      if (name === 'A') {
        return promise.then(() => (
          <div>
            {name}
            <Stateful name={name} />
          </div>
        ));
      }
      return (
        <div>
          {name}
          <Stateful name={name} />
        </div>
      );
    }

    const transport = ReactNoopFlightServer.render([
      <Item key="a" name="A" />,
      null,
    ]);

    // Create a gap in the stream
    await resolve();

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(<div>Aa</div>);

    const transport2 = ReactNoopFlightServer.render([
      null,
      <Item key="a" name="B" />,
    ]);

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport2));
    });

    expect(ReactNoop).toMatchRenderedOutput(<div>Ba</div>);
  });

  it('shares state when moving keyed Server Components that render fragments', async () => {
    function StatefulClient({name, initial}) {
      const [state] = React.useState(initial);
      return <span>{state}</span>;
    }
    const Stateful = clientReference(StatefulClient);

    function ServerComponent({item, initial}) {
      return [
        <Stateful key="a" initial={'a' + initial} />,
        <Stateful key="b" initial={'b' + initial} />,
      ];
    }

    const transport = ReactNoopFlightServer.render(
      <div>
        <ServerComponent key="A" initial={1} />
        <ServerComponent key="B" initial={2} />
      </div>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>a1</span>
        <span>b1</span>
        <span>a2</span>
        <span>b2</span>
      </div>,
    );

    // We swap the Server Components and the state of each child inside each fragment should move.
    // Really the Fragment itself moves.
    const transport2 = ReactNoopFlightServer.render(
      <div>
        <ServerComponent key="B" initial={4} />
        <ServerComponent key="A" initial={3} />
      </div>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport2));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>a2</span>
        <span>b2</span>
        <span>a1</span>
        <span>b1</span>
      </div>,
    );
  });

  // @gate enableFlightReadableStream && enableAsyncIterableChildren
  it('shares state when moving keyed Server Components that render async iterables', async () => {
    function StatefulClient({name, initial}) {
      const [state] = React.useState(initial);
      return <span>{state}</span>;
    }
    const Stateful = clientReference(StatefulClient);

    async function* ServerComponent({item, initial}) {
      yield <Stateful key="a" initial={'a' + initial} />;
      yield <Stateful key="b" initial={'b' + initial} />;
    }

    const transport = ReactNoopFlightServer.render(
      <div>
        <ServerComponent key="A" initial={1} />
        <ServerComponent key="B" initial={2} />
      </div>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>a1</span>
        <span>b1</span>
        <span>a2</span>
        <span>b2</span>
      </div>,
    );

    // We swap the Server Components and the state of each child inside each fragment should move.
    // Really the Fragment itself moves.
    const transport2 = ReactNoopFlightServer.render(
      <div>
        <ServerComponent key="B" initial={4} />
        <ServerComponent key="A" initial={3} />
      </div>,
    );

    await act(async () => {
      ReactNoop.render(await ReactNoopFlightClient.read(transport2));
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>a2</span>
        <span>b2</span>
        <span>a1</span>
        <span>b1</span>
      </div>,
    );
  });

  it('preserves debug info for server-to-server pass through', async () => {
    function ThirdPartyLazyComponent() {
      return <span>!</span>;
    }

    const lazy = React.lazy(async function myLazy() {
      return {
        default: <ThirdPartyLazyComponent />,
      };
    });

    function ThirdPartyComponent() {
      return <span>stranger</span>;
    }

    function ThirdPartyFragmentComponent() {
      return [<span key="1">Who</span>, ' ', <span key="2">dis?</span>];
    }

    function ServerComponent({transport}) {
      // This is a Server Component that receives other Server Components from a third party.
      const children = ReactNoopFlightClient.read(transport);
      return <div>Hello, {children}</div>;
    }

    const promiseComponent = Promise.resolve(<ThirdPartyComponent />);

    const thirdPartyTransport = ReactNoopFlightServer.render(
      [promiseComponent, lazy, <ThirdPartyFragmentComponent key="3" />],
      {
        environmentName: 'third-party',
      },
    );

    // Wait for the lazy component to initialize
    await 0;

    const transport = ReactNoopFlightServer.render(
      <ServerComponent transport={thirdPartyTransport} />,
    );

    await act(async () => {
      const promise = ReactNoopFlightClient.read(transport);
      expect(getDebugInfo(promise)).toEqual(
        __DEV__
          ? [
              {
                name: 'ServerComponent',
                env: 'Server',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      const result = await promise;
      const thirdPartyChildren = await result.props.children[1];
      // We expect the debug info to be transferred from the inner stream to the outer.
      expect(getDebugInfo(thirdPartyChildren[0])).toEqual(
        __DEV__
          ? [
              {
                name: 'ThirdPartyComponent',
                env: 'third-party',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      expect(getDebugInfo(thirdPartyChildren[1])).toEqual(
        __DEV__
          ? [
              {
                name: 'ThirdPartyLazyComponent',
                env: 'third-party',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in myLazy (at **)\n    in lazyInitializer (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      expect(getDebugInfo(thirdPartyChildren[2])).toEqual(
        __DEV__
          ? [
              {
                name: 'ThirdPartyFragmentComponent',
                env: 'third-party',
                key: '3',
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      ReactNoop.render(result);
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        Hello, <span>stranger</span>
        <span>!</span>
        <span>Who</span> <span>dis?</span>
      </div>,
    );
  });

  // @gate enableFlightReadableStream && enableAsyncIterableChildren
  it('preserves debug info for server-to-server pass through of async iterables', async () => {
    let resolve;
    const iteratorPromise = new Promise(r => (resolve = r));

    async function* ThirdPartyAsyncIterableComponent({item, initial}) {
      yield <span key="1">Who</span>;
      yield <span key="2">dis?</span>;
      resolve();
    }

    function Keyed({children}) {
      // Keying this should generate a fragment.
      return children;
    }

    function ServerComponent({transport}) {
      // This is a Server Component that receives other Server Components from a third party.
      const children = ReactServer.use(
        ReactNoopFlightClient.read(transport),
      ).root;
      return (
        <div>
          <Keyed key="keyed">{children}</Keyed>
        </div>
      );
    }

    const thirdPartyTransport = ReactNoopFlightServer.render(
      {root: <ThirdPartyAsyncIterableComponent />},
      {
        environmentName: 'third-party',
      },
    );

    if (gate(flag => flag.enableFlightReadableStream)) {
      // Wait for the iterator to finish
      await iteratorPromise;
    }
    await 0; // One more tick for the return value / closing.

    const transport = ReactNoopFlightServer.render(
      <ServerComponent transport={thirdPartyTransport} />,
    );

    await act(async () => {
      const promise = ReactNoopFlightClient.read(transport);
      expect(getDebugInfo(promise)).toEqual(
        __DEV__
          ? [
              {
                name: 'ServerComponent',
                env: 'Server',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      const result = await promise;
      const thirdPartyFragment = await result.props.children;
      expect(getDebugInfo(thirdPartyFragment)).toEqual(
        __DEV__
          ? [
              {
                name: 'Keyed',
                env: 'Server',
                key: 'keyed',
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in ServerComponent (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );
      // We expect the debug info to be transferred from the inner stream to the outer.
      expect(getDebugInfo(thirdPartyFragment.props.children)).toEqual(
        __DEV__
          ? [
              {
                name: 'ThirdPartyAsyncIterableComponent',
                env: 'third-party',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
            ]
          : undefined,
      );

      ReactNoop.render(result);
    });

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>Who</span>
        <span>dis?</span>
      </div>,
    );
  });

  it('preserves error stacks passed through server-to-server with source maps', async () => {
    async function ServerComponent({transport}) {
      // This is a Server Component that receives other Server Components from a third party.
      const thirdParty = ReactServer.use(
        ReactNoopFlightClient.read(transport, {
          findSourceMapURL(url) {
            // By giving a source map url we're saying that we can't use the original
            // file as the sourceURL, which gives stack traces a rsc://React/ prefix.
            return 'source-map://' + url;
          },
        }),
      );
      // This will throw a third-party error inside the first-party server component.
      await thirdParty.model;
      return 'Should never render';
    }

    async function bar() {
      throw new Error('third-party-error');
    }

    async function foo() {
      await bar();
    }

    const rejectedPromise = foo();

    const thirdPartyTransport = ReactNoopFlightServer.render(
      {model: rejectedPromise},
      {
        environmentName: 'third-party',
        onError(x) {
          if (__DEV__) {
            return 'a dev digest';
          }
          return `digest("${x.message}")`;
        },
      },
    );

    let originalError;
    try {
      await rejectedPromise;
    } catch (x) {
      originalError = x;
    }
    expect(originalError.message).toBe('third-party-error');

    const transport = ReactNoopFlightServer.render(
      <ServerComponent transport={thirdPartyTransport} />,
      {
        onError(x) {
          if (__DEV__) {
            return 'a dev digest';
          }
          return x.digest; // passthrough
        },
      },
    );

    await 0;
    await 0;
    await 0;

    const expectedErrorStack = originalError.stack
      // Test only the first rows since there's a lot of noise after that is eliminated.
      .split('\n')
      .slice(0, 4)
      .join('\n')
      .replaceAll(
        ' (/',
        gate(flags => flags.enableOwnerStacks) ? ' (file:///' : ' (/',
      ); // The eval will end up normalizing these

    let sawReactPrefix = false;
    const environments = [];
    await act(async () => {
      ReactNoop.render(
        <ErrorBoundary
          expectedMessage="third-party-error"
          expectedEnviromentName="third-party"
          expectedErrorStack={expectedErrorStack}>
          {ReactNoopFlightClient.read(transport, {
            findSourceMapURL(url, environmentName) {
              if (url.startsWith('rsc://React/')) {
                // We don't expect to see any React prefixed URLs here.
                sawReactPrefix = true;
              }
              environments.push(environmentName);
              // My not giving a source map, we should leave it intact.
              return null;
            },
          })}
        </ErrorBoundary>,
      );
    });

    expect(sawReactPrefix).toBe(false);
    if (__DEV__ && gate(flags => flags.enableOwnerStacks)) {
      expect(environments.slice(0, 4)).toEqual([
        'Server',
        'third-party',
        'third-party',
        'third-party',
      ]);
    } else {
      expect(environments).toEqual([]);
    }
  });

  it('can change the environment name inside a component', async () => {
    let env = 'A';
    function Component(props) {
      env = 'B';
      return <div>hi</div>;
    }

    const transport = ReactNoopFlightServer.render(
      {
        greeting: <Component />,
      },
      {
        environmentName() {
          return env;
        },
      },
    );

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      const greeting = rootModel.greeting;
      expect(getDebugInfo(greeting)).toEqual(
        __DEV__
          ? [
              {
                name: 'Component',
                env: 'A',
                key: null,
                owner: null,
                stack: gate(flag => flag.enableOwnerStacks)
                  ? '    in Object.<anonymous> (at **)'
                  : undefined,
              },
              {
                env: 'B',
              },
            ]
          : undefined,
      );
      ReactNoop.render(greeting);
    });

    expect(ReactNoop).toMatchRenderedOutput(<div>hi</div>);
  });

  // @gate enableServerComponentLogs && __DEV__ && enableOwnerStacks
  it('replays logs, but not onError logs', async () => {
    function foo() {
      return 'hello';
    }

    function ServerComponent() {
      console.log('hi', {
        prop: 123,
        fn: foo,
        map: new Map([['foo', foo]]),
        promise: new Promise(() => {}),
      });
      throw new Error('err');
    }

    function App() {
      return ReactServer.createElement(ServerComponent);
    }

    let ownerStacks = [];

    // These tests are specifically testing console.log.
    // Assign to `mockConsoleLog` so we can still inspect it when `console.log`
    // is overridden by the test modules. The original function will be restored
    // after this test finishes by `jest.restoreAllMocks()`.
    const mockConsoleLog = spyOnDevAndProd(console, 'log').mockImplementation(
      () => {
        // Uses server React.
        ownerStacks.push(normalizeCodeLocInfo(ReactServer.captureOwnerStack()));
      },
    );

    let transport;
    expect(() => {
      // Reset the modules so that we get a new overridden console on top of the
      // one installed by expect. This ensures that we still emit console.error
      // calls.
      jest.resetModules();
      jest.mock('react', () => require('react/react.react-server'));
      ReactServer = require('react');
      ReactNoopFlightServer = require('react-noop-renderer/flight-server');
      transport = ReactNoopFlightServer.render({
        root: ReactServer.createElement(App),
      });
    }).toErrorDev('err');

    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog.mock.calls[0][0]).toBe('hi');
    expect(mockConsoleLog.mock.calls[0][1].prop).toBe(123);
    expect(ownerStacks).toEqual(['\n    in App (at **)']);
    mockConsoleLog.mockClear();
    mockConsoleLog.mockImplementation(() => {
      // Switching to client React.
      ownerStacks.push(normalizeCodeLocInfo(React.captureOwnerStack()));
    });
    ownerStacks = [];

    // The error should not actually get logged because we're not awaiting the root
    // so it's not thrown but the server log also shouldn't be replayed.
    await ReactNoopFlightClient.read(transport);

    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog.mock.calls[0][0]).toBe('hi');
    expect(mockConsoleLog.mock.calls[0][1].prop).toBe(123);
    const loggedFn = mockConsoleLog.mock.calls[0][1].fn;
    expect(typeof loggedFn).toBe('function');
    expect(loggedFn).not.toBe(foo);
    expect(loggedFn.toString()).toBe(foo.toString());

    const loggedMap = mockConsoleLog.mock.calls[0][1].map;
    expect(loggedMap instanceof Map).toBe(true);
    const loggedFn2 = loggedMap.get('foo');
    expect(typeof loggedFn2).toBe('function');
    expect(loggedFn2).not.toBe(foo);
    expect(loggedFn2.toString()).toBe(foo.toString());

    const promise = mockConsoleLog.mock.calls[0][1].promise;
    expect(promise).toBeInstanceOf(Promise);

    expect(ownerStacks).toEqual(['\n    in App (at **)']);
  });

  it('uses the server component debug info as the element owner in DEV', async () => {
    function Container({children}) {
      return children;
    }

    function Greeting({firstName}) {
      // We can't use JSX here because it'll use the Client React.
      return ReactServer.createElement(
        Container,
        null,
        ReactServer.createElement('span', null, 'Hello, ', firstName),
      );
    }

    const model = {
      greeting: ReactServer.createElement(Greeting, {firstName: 'Seb'}),
    };

    const transport = ReactNoopFlightServer.render(model);

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      const greeting = rootModel.greeting;
      // We've rendered down to the span.
      expect(greeting.type).toBe('span');
      if (__DEV__) {
        const greetInfo = {
          name: 'Greeting',
          env: 'Server',
          key: null,
          owner: null,
          stack: gate(flag => flag.enableOwnerStacks)
            ? '    in Object.<anonymous> (at **)'
            : undefined,
        };
        expect(getDebugInfo(greeting)).toEqual([
          greetInfo,
          {
            name: 'Container',
            env: 'Server',
            key: null,
            owner: greetInfo,
            stack: gate(flag => flag.enableOwnerStacks)
              ? '    in Greeting (at **)'
              : undefined,
          },
        ]);
        // The owner that created the span was the outer server component.
        // We expect the debug info to be referentially equal to the owner.
        expect(greeting._owner).toBe(greeting._debugInfo[0]);
      } else {
        expect(greeting._debugInfo).toBe(undefined);
        expect(greeting._owner).toBe(
          gate(flags => flags.disableStringRefs) ? undefined : null,
        );
      }
      ReactNoop.render(greeting);
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>Hello, Seb</span>);
  });

  // @gate __DEV__ && enableOwnerStacks
  it('can get the component owner stacks during rendering in dev', () => {
    let stack;

    function Foo() {
      return ReactServer.createElement(Bar, null);
    }
    function Bar() {
      return ReactServer.createElement(
        'div',
        null,
        ReactServer.createElement(Baz, null),
      );
    }

    function Baz() {
      stack = ReactServer.captureOwnerStack();
      return ReactServer.createElement('span', null, 'hi');
    }
    ReactNoopFlightServer.render(
      ReactServer.createElement(
        'div',
        null,
        ReactServer.createElement(Foo, null),
      ),
    );

    expect(normalizeCodeLocInfo(stack)).toBe(
      '\n    in Bar (at **)' + '\n    in Foo (at **)',
    );
  });

  // @gate __DEV__ && enableOwnerStacks
  it('can get the component owner stacks for onError in dev', async () => {
    const thrownError = new Error('hi');
    let caughtError;
    let ownerStack;

    function Foo() {
      return ReactServer.createElement(Bar, null);
    }
    function Bar() {
      return ReactServer.createElement(
        'div',
        null,
        ReactServer.createElement(Baz, null),
      );
    }
    function Baz() {
      throw thrownError;
    }

    ReactNoopFlightServer.render(
      ReactServer.createElement(
        'div',
        null,
        ReactServer.createElement(Foo, null),
      ),
      {
        onError(error, errorInfo) {
          caughtError = error;
          ownerStack = ReactServer.captureOwnerStack
            ? ReactServer.captureOwnerStack()
            : null;
        },
      },
    );

    expect(caughtError).toBe(thrownError);
    expect(normalizeCodeLocInfo(ownerStack)).toBe(
      '\n    in Bar (at **)' + '\n    in Foo (at **)',
    );
  });

  // @gate (enableOwnerStacks && enableServerComponentLogs) || !__DEV__
  it('should include only one component stack in replayed logs (if DevTools or polyfill adds them)', () => {
    class MyError extends Error {
      toJSON() {
        return 123;
      }
    }

    function Foo() {
      return ReactServer.createElement('div', null, [
        'Womp womp: ',
        new MyError('spaghetti'),
      ]);
    }

    function Bar() {
      const array = [];
      // Trigger key warning
      array.push(ReactServer.createElement(Foo));
      return ReactServer.createElement('div', null, array);
    }

    function App() {
      return ReactServer.createElement(Bar);
    }

    // While we're on the server we need to have the Server version active to track component stacks.
    jest.resetModules();
    jest.mock('react', () => ReactServer);
    const transport = ReactNoopFlightServer.render(
      ReactServer.createElement(App),
    );

    assertConsoleErrorDev([
      'Each child in a list should have a unique "key" prop.' +
        ' See https://react.dev/link/warning-keys for more information.\n' +
        '    in Bar (at **)\n' +
        '    in App (at **)',
      'Error objects cannot be rendered as text children. Try formatting it using toString().\n' +
        '  <div>Womp womp: {Error}</div>\n' +
        '                  ^^^^^^^\n' +
        '    in Foo (at **)\n' +
        '    in Bar (at **)\n' +
        '    in App (at **)',
    ]);

    // Replay logs on the client
    jest.resetModules();
    jest.mock('react', () => React);
    ReactNoopFlightClient.read(transport);
    assertConsoleErrorDev([
      'Each child in a list should have a unique "key" prop.' +
        ' See https://react.dev/link/warning-keys for more information.\n' +
        '    in Bar (at **)\n' +
        '    in App (at **)',
      'Error objects cannot be rendered as text children. Try formatting it using toString().\n' +
        '  <div>Womp womp: {Error}</div>\n' +
        '                  ^^^^^^^\n' +
        '    in Foo (at **)\n' +
        '    in Bar (at **)\n' +
        '    in App (at **)',
    ]);
  });

  it('can filter out stack frames of a serialized error in dev', async () => {
    async function bar() {
      throw new Error('my-error');
    }

    async function intermediate() {
      await bar();
    }

    async function foo() {
      await intermediate();
    }

    const rejectedPromise = foo();
    const transport = ReactNoopFlightServer.render(
      {model: rejectedPromise},
      {
        onError(x) {
          return `digest("${x.message}")`;
        },
        filterStackFrame(url, functionName) {
          return functionName !== 'intermediate';
        },
      },
    );

    let originalError;
    try {
      await rejectedPromise;
    } catch (x) {
      originalError = x;
    }

    const root = await ReactNoopFlightClient.read(transport);
    let caughtError;
    try {
      await root.model;
    } catch (x) {
      caughtError = x;
    }
    if (__DEV__) {
      expect(caughtError.message).toBe(originalError.message);
      expect(normalizeCodeLocInfo(caughtError.stack)).toContain(
        '\n    in bar (at **)' + '\n    in foo (at **)',
      );
    }
    expect(normalizeCodeLocInfo(originalError.stack)).toContain(
      '\n    in bar (at **)' +
        '\n    in intermediate (at **)' +
        '\n    in foo (at **)',
    );
    expect(caughtError.digest).toBe('digest("my-error")');
  });
});
