let React;
let ReactTestRenderer;
let ReactFeatureFlags;
let Suspense;
let lazy;

describe('ReactLazy', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    Suspense = React.unstable_Suspense;
    lazy = React.lazy;
    ReactTestRenderer = require('react-test-renderer');
  });

  function Text(props) {
    ReactTestRenderer.unstable_yield(props.text);
    return props.text;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }

  async function fakeImport(result) {
    return {default: result};
  }

  it('suspends until module has loaded', async () => {
    const LazyText = lazy(() => fakeImport(Text));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText text="Hi" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();

    expect(root).toFlushAndYield(['Hi']);
    expect(root).toMatchRenderedOutput('Hi');

    // Should not suspend on update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText text="Hi again" />
      </Suspense>,
    );
    expect(root).toFlushAndYield(['Hi again']);
    expect(root).toMatchRenderedOutput('Hi again');
  });

  it('multiple lazy components', async () => {
    function Foo() {
      return <Text text="Foo" />;
    }

    function Bar() {
      return <Text text="Bar" />;
    }

    const promiseForFoo = delay(1000).then(() => fakeImport(Foo));
    const promiseForBar = delay(2000).then(() => fakeImport(Bar));

    const LazyFoo = lazy(() => promiseForFoo);
    const LazyBar = lazy(() => promiseForBar);

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyFoo />
        <LazyBar />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    jest.advanceTimersByTime(1000);
    await promiseForFoo;

    expect(root).toFlushAndYield(['Foo', 'Loading...']);
    expect(root).toMatchRenderedOutput(null);

    jest.advanceTimersByTime(1000);
    await promiseForBar;

    expect(root).toFlushAndYield(['Foo', 'Bar']);
    expect(root).toMatchRenderedOutput('FooBar');
  });

  it('does not support arbitrary promises, only module objects', async () => {
    spyOnDev(console, 'error');

    const LazyText = lazy(async () => Text);

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText text="Hi" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );
    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Expected the result of a dynamic import() call',
      );
    }
    expect(root).toFlushAndThrow('Element type is invalid');
  });

  it('throws if promise rejects', async () => {
    const LazyText = lazy(async () => {
      throw new Error('Bad network');
    });

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText text="Hi" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    try {
      await Promise.resolve();
    } catch (e) {}

    expect(root).toFlushAndThrow('Bad network');
  });

  it('mount and reorder', async () => {
    class Child extends React.Component {
      componentDidMount() {
        ReactTestRenderer.unstable_yield('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        ReactTestRenderer.unstable_yield('Did update: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    const LazyChildA = lazy(() => fakeImport(Child));
    const LazyChildB = lazy(() => fakeImport(Child));

    function Parent({swap}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {swap
            ? [
                <LazyChildB key="B" label="B" />,
                <LazyChildA key="A" label="A" />,
              ]
            : [
                <LazyChildA key="A" label="A" />,
                <LazyChildB key="B" label="B" />,
              ]}
        </Suspense>
      );
    }

    const root = ReactTestRenderer.create(<Parent swap={false} />, {
      unstable_isConcurrent: true,
    });

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await LazyChildA;
    await LazyChildB;

    expect(root).toFlushAndYield(['A', 'B', 'Did mount: A', 'Did mount: B']);
    expect(root).toMatchRenderedOutput('AB');

    // Swap the position of A and B
    root.update(<Parent swap={true} />);
    expect(root).toFlushAndYield(['B', 'A', 'Did update: B', 'Did update: A']);
    expect(root).toMatchRenderedOutput('BA');
  });

  it('resolves defaultProps, on mount and update', async () => {
    function T(props) {
      return <Text {...props} />;
    }
    T.defaultProps = {text: 'Hi'};
    const LazyText = lazy(() => fakeImport(T));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();

    expect(root).toFlushAndYield(['Hi']);
    expect(root).toMatchRenderedOutput('Hi');

    T.defaultProps = {text: 'Hi again'};
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText />
      </Suspense>,
    );
    expect(root).toFlushAndYield(['Hi again']);
    expect(root).toMatchRenderedOutput('Hi again');
  });

  it('resolves defaultProps without breaking memoization', async () => {
    function LazyImpl(props) {
      ReactTestRenderer.unstable_yield('Lazy');
      return (
        <React.Fragment>
          <Text text={props.siblingText} />
          {props.children}
        </React.Fragment>
      );
    }
    LazyImpl.defaultProps = {siblingText: 'Sibling'};
    const Lazy = lazy(() => fakeImport(LazyImpl));

    class Stateful extends React.Component {
      state = {text: 'A'};
      render() {
        return <Text text={this.state.text} />;
      }
    }

    const stateful = React.createRef(null);

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <Lazy>
          <Stateful ref={stateful} />
        </Lazy>
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );
    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();

    expect(root).toFlushAndYield(['Lazy', 'Sibling', 'A']);
    expect(root).toMatchRenderedOutput('SiblingA');

    // Lazy should not re-render
    stateful.current.setState({text: 'B'});
    expect(root).toFlushAndYield(['B']);
    expect(root).toMatchRenderedOutput('SiblingB');
  });

  it('includes lazy-loaded component in warning stack', async () => {
    const LazyFoo = lazy(() => {
      ReactTestRenderer.unstable_yield('Started loading');
      const Foo = props => <div>{[<Text text="A" />, <Text text="B" />]}</div>;
      return fakeImport(Foo);
    });

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyFoo />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Started loading', 'Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();

    expect(() => {
      expect(root).toFlushAndYield(['A', 'B']);
    }).toWarnDev('    in Text (at **)\n' + '    in Foo (at **)');
    expect(root).toMatchRenderedOutput(<div>AB</div>);
  });

  it('supports class and forwardRef components', async () => {
    const LazyClass = lazy(() => {
      class Foo extends React.Component {
        render() {
          return <Text text="Foo" />;
        }
      }
      return fakeImport(Foo);
    });

    const LazyForwardRef = lazy(() => {
      class Bar extends React.Component {
        render() {
          return <Text text="Bar" />;
        }
      }
      return fakeImport(
        React.forwardRef((props, ref) => {
          ReactTestRenderer.unstable_yield('forwardRef');
          return <Bar ref={ref} />;
        }),
      );
    });

    const ref = React.createRef();
    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass />
        <LazyForwardRef ref={ref} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);
    expect(ref.current).toBe(null);

    await Promise.resolve();

    expect(root).toFlushAndYield(['Foo', 'forwardRef', 'Bar']);
    expect(root).toMatchRenderedOutput('FooBar');
    expect(ref.current).not.toBe(null);
  });
});
