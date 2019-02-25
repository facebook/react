let PropTypes;
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
    PropTypes = require('prop-types');
    React = require('react');
    Suspense = React.Suspense;
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

  it('can resolve synchronously without suspending', async () => {
    const LazyText = lazy(() => ({
      then(cb) {
        cb({default: Text});
      },
    }));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText text="Hi" />
      </Suspense>,
    );

    expect(ReactTestRenderer).toHaveYielded(['Hi']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('can reject synchronously without suspending', async () => {
    const LazyText = lazy(() => ({
      then(resolve, reject) {
        reject(new Error('oh no'));
      },
    }));

    class ErrorBoundary extends React.Component {
      state = {};
      static getDerivedStateFromError(error) {
        return {message: error.message};
      }
      render() {
        return this.state.message
          ? `Error: ${this.state.message}`
          : this.props.children;
      }
    }

    const root = ReactTestRenderer.create(
      <ErrorBoundary>
        <Suspense fallback={<Text text="Loading..." />}>
          <LazyText text="Hi" />
        </Suspense>
      </ErrorBoundary>,
    );
    expect(ReactTestRenderer).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Error: oh no');
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

  it('sets defaultProps for modern lifecycles', async () => {
    class C extends React.Component {
      static defaultProps = {text: 'A'};
      state = {};

      static getDerivedStateFromProps(props) {
        ReactTestRenderer.unstable_yield(
          `getDerivedStateFromProps: ${props.text}`,
        );
        return null;
      }

      constructor(props) {
        super(props);
        ReactTestRenderer.unstable_yield(`constructor: ${this.props.text}`);
      }

      componentDidMount() {
        ReactTestRenderer.unstable_yield(
          `componentDidMount: ${this.props.text}`,
        );
      }

      componentDidUpdate(prevProps) {
        ReactTestRenderer.unstable_yield(
          `componentDidUpdate: ${prevProps.text} -> ${this.props.text}`,
        );
      }

      componentWillUnmount() {
        ReactTestRenderer.unstable_yield(
          `componentWillUnmount: ${this.props.text}`,
        );
      }

      shouldComponentUpdate(nextProps) {
        ReactTestRenderer.unstable_yield(
          `shouldComponentUpdate: ${this.props.text} -> ${nextProps.text}`,
        );
        return true;
      }

      getSnapshotBeforeUpdate(prevProps) {
        ReactTestRenderer.unstable_yield(
          `getSnapshotBeforeUpdate: ${prevProps.text} -> ${this.props.text}`,
        );
        return null;
      }

      render() {
        return <Text text={this.props.text + this.props.num} />;
      }
    }

    const LazyClass = lazy(() => fakeImport(C));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={1} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();

    expect(root).toFlushAndYield([
      'constructor: A',
      'getDerivedStateFromProps: A',
      'A1',
      'componentDidMount: A',
    ]);

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={2} />
      </Suspense>,
    );
    expect(root).toFlushAndYield([
      'getDerivedStateFromProps: A',
      'shouldComponentUpdate: A -> A',
      'A2',
      'getSnapshotBeforeUpdate: A -> A',
      'componentDidUpdate: A -> A',
    ]);
    expect(root).toMatchRenderedOutput('A2');

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={3} />
      </Suspense>,
    );
    expect(root).toFlushAndYield([
      'getDerivedStateFromProps: A',
      'shouldComponentUpdate: A -> A',
      'A3',
      'getSnapshotBeforeUpdate: A -> A',
      'componentDidUpdate: A -> A',
    ]);
    expect(root).toMatchRenderedOutput('A3');
  });

  it('sets defaultProps for legacy lifecycles', async () => {
    class C extends React.Component {
      static defaultProps = {text: 'A'};
      state = {};

      UNSAFE_componentWillMount() {
        ReactTestRenderer.unstable_yield(
          `UNSAFE_componentWillMount: ${this.props.text}`,
        );
      }

      UNSAFE_componentWillUpdate(nextProps) {
        ReactTestRenderer.unstable_yield(
          `UNSAFE_componentWillUpdate: ${this.props.text} -> ${nextProps.text}`,
        );
      }

      UNSAFE_componentWillReceiveProps(nextProps) {
        ReactTestRenderer.unstable_yield(
          `UNSAFE_componentWillReceiveProps: ${this.props.text} -> ${
            nextProps.text
          }`,
        );
      }

      render() {
        return <Text text={this.props.text + this.props.num} />;
      }
    }

    const LazyClass = lazy(() => fakeImport(C));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={1} />
      </Suspense>,
    );

    expect(ReactTestRenderer).toHaveYielded(['Loading...']);
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('Loading...');

    await Promise.resolve();

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={2} />
      </Suspense>,
    );
    expect(ReactTestRenderer).toHaveYielded([
      'UNSAFE_componentWillMount: A',
      'A1',
      'UNSAFE_componentWillReceiveProps: A -> A',
      'UNSAFE_componentWillUpdate: A -> A',
      'A2',
    ]);
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('A2');

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={3} />
      </Suspense>,
    );
    expect(ReactTestRenderer).toHaveYielded([
      'UNSAFE_componentWillReceiveProps: A -> A',
      'UNSAFE_componentWillUpdate: A -> A',
      'A3',
    ]);
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('A3');
  });

  it('resolves defaultProps on the outer wrapper but warns', async () => {
    function T(props) {
      ReactTestRenderer.unstable_yield(props.inner + ' ' + props.outer);
      return props.inner + ' ' + props.outer;
    }
    T.defaultProps = {inner: 'Hi'};
    const LazyText = lazy(() => fakeImport(T));
    expect(() => {
      LazyText.defaultProps = {outer: 'Bye'};
    }).toWarnDev(
      'React.lazy(...): It is not supported to assign `defaultProps` to ' +
        'a lazy component import. Either specify them where the component ' +
        'is defined, or create a wrapping component around it.',
      {withoutStack: true},
    );

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
    expect(root).toFlushAndYield(['Hi Bye']);
    expect(root).toMatchRenderedOutput('Hi Bye');

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText outer="World" />
      </Suspense>,
    );
    expect(root).toFlushAndYield(['Hi World']);
    expect(root).toMatchRenderedOutput('Hi World');

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText inner="Friends" />
      </Suspense>,
    );
    expect(root).toFlushAndYield(['Friends Bye']);
    expect(root).toMatchRenderedOutput('Friends Bye');
  });

  it('throws with a useful error when wrapping invalid type with lazy()', async () => {
    const BadLazy = lazy(() => fakeImport(42));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <BadLazy />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <BadLazy />
      </Suspense>,
    );
    expect(() => {
      root.unstable_flushAll();
    }).toThrow(
      'Element type is invalid. Received a promise that resolves to: 42. ' +
        'Lazy element type must resolve to a class or function.',
    );
  });

  it('throws with a useful error when wrapping lazy() multiple times', async () => {
    const Lazy1 = lazy(() => fakeImport(Text));
    const Lazy2 = lazy(() => fakeImport(Lazy1));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <Lazy2 text="Hello" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    await Promise.resolve();
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <Lazy2 text="Hello" />
      </Suspense>,
    );
    expect(() => {
      root.unstable_flushAll();
    }).toThrow(
      'Element type is invalid. Received a promise that resolves to: [object Object]. ' +
        'Lazy element type must resolve to a class or function.' +
        (__DEV__
          ? ' Did you wrap a component in React.lazy() more than once?'
          : ''),
    );
  });

  it('warns about defining propTypes on the outer wrapper', () => {
    const LazyText = lazy(() => fakeImport(Text));
    expect(() => {
      LazyText.propTypes = {hello: () => {}};
    }).toWarnDev(
      'React.lazy(...): It is not supported to assign `propTypes` to ' +
        'a lazy component import. Either specify them where the component ' +
        'is defined, or create a wrapping component around it.',
      {withoutStack: true},
    );
  });

  async function verifyInnerPropTypesAreChecked(Add) {
    const LazyAdd = lazy(() => fakeImport(Add));
    expect(() => {
      LazyAdd.propTypes = {};
    }).toWarnDev(
      'React.lazy(...): It is not supported to assign `propTypes` to ' +
        'a lazy component import. Either specify them where the component ' +
        'is defined, or create a wrapping component around it.',
      {withoutStack: true},
    );

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd inner="2" outer="2" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    // Mount
    await Promise.resolve();
    expect(() => {
      root.unstable_flushAll();
    }).toWarnDev(
      'Invalid prop `inner` of type `string` supplied to `Add`, expected `number`.',
    );
    expect(root).toMatchRenderedOutput('22');

    // Update
    expect(() => {
      root.update(
        <Suspense fallback={<Text text="Loading..." />}>
          <LazyAdd inner={false} outer={false} />
        </Suspense>,
      );
      root.unstable_flushAll();
    }).toWarnDev(
      'Invalid prop `inner` of type `boolean` supplied to `Add`, expected `number`.',
    );
    expect(root).toMatchRenderedOutput('0');
  }

  // Note: all "with defaultProps" tests below also verify defaultProps works as expected.
  // If we ever delete or move propTypes-related tests, make sure not to delete these.
  it('respects propTypes on function component with defaultProps', async () => {
    function Add(props) {
      expect(props.innerWithDefault).toBe(42);
      return props.inner + props.outer;
    }
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
      innerWithDefault: PropTypes.number.isRequired,
    };
    Add.defaultProps = {
      innerWithDefault: 42,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on function component without defaultProps', async () => {
    function Add(props) {
      return props.inner + props.outer;
    }
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on class component with defaultProps', async () => {
    class Add extends React.Component {
      render() {
        expect(this.props.innerWithDefault).toBe(42);
        return this.props.inner + this.props.outer;
      }
    }
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
      innerWithDefault: PropTypes.number.isRequired,
    };
    Add.defaultProps = {
      innerWithDefault: 42,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on class component without defaultProps', async () => {
    class Add extends React.Component {
      render() {
        return this.props.inner + this.props.outer;
      }
    }
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on forwardRef component with defaultProps', async () => {
    const Add = React.forwardRef((props, ref) => {
      expect(props.innerWithDefault).toBe(42);
      return props.inner + props.outer;
    });
    Add.displayName = 'Add';
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
      innerWithDefault: PropTypes.number.isRequired,
    };
    Add.defaultProps = {
      innerWithDefault: 42,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on forwardRef component without defaultProps', async () => {
    const Add = React.forwardRef((props, ref) => {
      return props.inner + props.outer;
    });
    Add.displayName = 'Add';
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on outer memo component with defaultProps', async () => {
    let Add = props => {
      expect(props.innerWithDefault).toBe(42);
      return props.inner + props.outer;
    };
    Add = React.memo(Add);
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
      innerWithDefault: PropTypes.number.isRequired,
    };
    Add.defaultProps = {
      innerWithDefault: 42,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on outer memo component without defaultProps', async () => {
    let Add = props => {
      return props.inner + props.outer;
    };
    Add = React.memo(Add);
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
    };
    await verifyInnerPropTypesAreChecked(Add);
  });

  it('respects propTypes on inner memo component with defaultProps', async () => {
    const Add = props => {
      expect(props.innerWithDefault).toBe(42);
      return props.inner + props.outer;
    };
    Add.displayName = 'Add';
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
      innerWithDefault: PropTypes.number.isRequired,
    };
    Add.defaultProps = {
      innerWithDefault: 42,
    };
    await verifyInnerPropTypesAreChecked(React.memo(Add));
  });

  it('respects propTypes on inner memo component without defaultProps', async () => {
    const Add = props => {
      return props.inner + props.outer;
    };
    Add.displayName = 'Add';
    Add.propTypes = {
      inner: PropTypes.number.isRequired,
    };
    await verifyInnerPropTypesAreChecked(React.memo(Add));
  });

  it('uses outer resolved props for validating propTypes on memo', async () => {
    let T = props => {
      return <Text text={props.text} />;
    };
    T.defaultProps = {
      text: 'Inner default text',
    };
    T = React.memo(T);
    T.propTypes = {
      // Should not be satisfied by the *inner* defaultProps.
      text: PropTypes.string.isRequired,
    };
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

    // Mount
    await Promise.resolve();
    expect(() => {
      root.unstable_flushAll();
    }).toWarnDev(
      'The prop `text` is marked as required in `T`, but its value is `undefined`',
    );
    expect(root).toMatchRenderedOutput('Inner default text');

    // Update
    expect(() => {
      root.update(
        <Suspense fallback={<Text text="Loading..." />}>
          <LazyText text={null} />
        </Suspense>,
      );
      root.unstable_flushAll();
    }).toWarnDev(
      'The prop `text` is marked as required in `T`, but its value is `null`',
    );
    expect(root).toMatchRenderedOutput(null);
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

  // Regression test for #14310
  it('supports defaultProps defined on the memo() return value', async () => {
    const Add = React.memo(props => {
      return props.inner + props.outer;
    });
    Add.defaultProps = {
      inner: 2,
    };
    const LazyAdd = lazy(() => fakeImport(Add));
    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={2} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );
    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    // Mount
    await Promise.resolve();
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('4');

    // Update (shallowly equal)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={2} />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('4');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={3} />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('5');

    // Update (shallowly equal)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={3} />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('5');

    // Update (explicit props)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={1} inner={1} />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('2');

    // Update (explicit props, shallowly equal)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={1} inner={1} />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('2');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={1} />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('3');
  });

  it('merges defaultProps in the correct order', async () => {
    let Add = React.memo(props => {
      return props.inner + props.outer;
    });
    Add.defaultProps = {
      inner: 100,
    };
    Add = React.memo(Add);
    Add.defaultProps = {
      inner: 2,
      outer: 0,
    };
    const LazyAdd = lazy(() => fakeImport(Add));
    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={2} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );
    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);

    // Mount
    await Promise.resolve();
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('4');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={3} />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('5');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd />
      </Suspense>,
    );
    root.unstable_flushAll();
    expect(root).toMatchRenderedOutput('2');
  });

  it('warns about ref on functions for lazy-loaded components', async () => {
    const LazyFoo = lazy(() => {
      const Foo = props => <div />;
      return fakeImport(Foo);
    });

    const ref = React.createRef();
    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyFoo ref={ref} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield(['Loading...']);
    expect(root).toMatchRenderedOutput(null);
    await Promise.resolve();
    expect(() => {
      expect(root).toFlushAndYield([]);
    }).toWarnDev('Function components cannot be given refs');
  });
});
