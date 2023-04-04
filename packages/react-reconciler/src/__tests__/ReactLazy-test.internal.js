let PropTypes;
let React;
let ReactTestRenderer;
let Scheduler;
let ReactFeatureFlags;
let Suspense;
let lazy;
let waitFor;
let waitForAll;
let waitForThrow;
let assertLog;

let fakeModuleCache;

function normalizeCodeLocInfo(str) {
  return (
    str &&
    str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
      return '\n    in ' + name + ' (at **)';
    })
  );
}

describe('ReactLazy', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');

    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    PropTypes = require('prop-types');
    React = require('react');
    Suspense = React.Suspense;
    lazy = React.lazy;
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');

    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    waitForAll = InternalTestUtils.waitForAll;
    waitForThrow = InternalTestUtils.waitForThrow;
    assertLog = InternalTestUtils.assertLog;

    fakeModuleCache = new Map();
  });

  function Text(props) {
    Scheduler.log(props.text);
    return props.text;
  }

  async function fakeImport(Component) {
    const record = fakeModuleCache.get(Component);
    if (record === undefined) {
      const newRecord = {
        status: 'pending',
        value: {default: Component},
        pings: [],
        then(ping) {
          switch (newRecord.status) {
            case 'pending': {
              newRecord.pings.push(ping);
              return;
            }
            case 'resolved': {
              ping(newRecord.value);
              return;
            }
            case 'rejected': {
              throw newRecord.value;
            }
          }
        },
      };
      fakeModuleCache.set(Component, newRecord);
      return newRecord;
    }
    return record;
  }

  function resolveFakeImport(moduleName) {
    const record = fakeModuleCache.get(moduleName);
    if (record === undefined) {
      throw new Error('Module not found');
    }
    if (record.status !== 'pending') {
      throw new Error('Module already resolved');
    }
    record.status = 'resolved';
    record.pings.forEach(ping => ping(record.value));
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

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('Hi');

    await resolveFakeImport(Text);

    await waitForAll(['Hi']);
    expect(root).toMatchRenderedOutput('Hi');

    // Should not suspend on update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText text="Hi again" />
      </Suspense>,
    );
    await waitForAll(['Hi again']);
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

    assertLog(['Hi']);
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
    assertLog([]);
    expect(root).toMatchRenderedOutput('Error: oh no');
  });

  it('multiple lazy components', async () => {
    function Foo() {
      return <Text text="Foo" />;
    }

    function Bar() {
      return <Text text="Bar" />;
    }

    const LazyFoo = lazy(() => fakeImport(Foo));
    const LazyBar = lazy(() => fakeImport(Bar));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyFoo />
        <LazyBar />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('FooBar');

    await resolveFakeImport(Foo);

    await waitForAll(['Foo']);
    expect(root).not.toMatchRenderedOutput('FooBar');

    await resolveFakeImport(Bar);

    await waitForAll(['Foo', 'Bar']);
    expect(root).toMatchRenderedOutput('FooBar');
  });

  it('does not support arbitrary promises, only module objects', async () => {
    spyOnDev(console, 'error').mockImplementation(() => {});

    const LazyText = lazy(async () => Text);

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText text="Hi" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );
    await waitForThrow('Element type is invalid');
    assertLog(['Loading...']);
    expect(root).not.toMatchRenderedOutput('Hi');
    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(3);
      expect(console.error.mock.calls[0][0]).toContain(
        'Expected the result of a dynamic import() call',
      );
    }
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

    await waitForThrow('Bad network');
    assertLog(['Loading...']);
    expect(root).not.toMatchRenderedOutput('Hi');
  });

  it('mount and reorder', async () => {
    class Child extends React.Component {
      componentDidMount() {
        Scheduler.log('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        Scheduler.log('Did update: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    const LazyChildA = lazy(() => {
      Scheduler.log('Suspend! [LazyChildA]');
      return fakeImport(Child);
    });
    const LazyChildB = lazy(() => {
      Scheduler.log('Suspend! [LazyChildB]');
      return fakeImport(Child);
    });

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

    await waitForAll(['Suspend! [LazyChildA]', 'Loading...']);
    expect(root).not.toMatchRenderedOutput('AB');

    await resolveFakeImport(Child);

    // B suspends even though it happens to share the same import as A.
    // TODO: React.lazy should implement the `status` and `value` fields, so
    // we can unwrap the result synchronously if it already loaded. Like `use`.
    await waitFor(['A', 'Suspend! [LazyChildB]']);

    await waitForAll(['A', 'B', 'Did mount: A', 'Did mount: B']);
    expect(root).toMatchRenderedOutput('AB');

    // Swap the position of A and B
    root.update(<Parent swap={true} />);
    await waitForAll(['B', 'A', 'Did update: B', 'Did update: A']);
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

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('Hi');

    await resolveFakeImport(T);

    await expect(async () => await waitForAll(['Hi'])).toErrorDev(
      'Warning: T: Support for defaultProps ' +
        'will be removed from function components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );

    expect(root).toMatchRenderedOutput('Hi');

    T.defaultProps = {text: 'Hi again'};
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText />
      </Suspense>,
    );
    await waitForAll(['Hi again']);
    expect(root).toMatchRenderedOutput('Hi again');
  });

  it('resolves defaultProps without breaking memoization', async () => {
    function LazyImpl(props) {
      Scheduler.log('Lazy');
      return (
        <>
          <Text text={props.siblingText} />
          {props.children}
        </>
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
    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('SiblingA');

    await resolveFakeImport(LazyImpl);

    await expect(
      async () => await waitForAll(['Lazy', 'Sibling', 'A']),
    ).toErrorDev(
      'Warning: LazyImpl: Support for defaultProps ' +
        'will be removed from function components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );

    expect(root).toMatchRenderedOutput('SiblingA');

    // Lazy should not re-render
    stateful.current.setState({text: 'B'});
    await waitForAll(['B']);
    expect(root).toMatchRenderedOutput('SiblingB');
  });

  it('resolves defaultProps without breaking bailout due to unchanged props and state, #17151', async () => {
    class LazyImpl extends React.Component {
      static defaultProps = {value: 0};

      render() {
        const text = `${this.props.label}: ${this.props.value}`;
        return <Text text={text} />;
      }
    }

    const Lazy = lazy(() => fakeImport(LazyImpl));

    const instance1 = React.createRef(null);
    const instance2 = React.createRef(null);

    const root = ReactTestRenderer.create(
      <>
        <LazyImpl ref={instance1} label="Not lazy" />
        <Suspense fallback={<Text text="Loading..." />}>
          <Lazy ref={instance2} label="Lazy" />
        </Suspense>
      </>,
      {
        unstable_isConcurrent: true,
      },
    );
    await waitForAll(['Not lazy: 0', 'Loading...']);
    expect(root).not.toMatchRenderedOutput('Not lazy: 0Lazy: 0');

    await resolveFakeImport(LazyImpl);

    await waitForAll(['Lazy: 0']);
    expect(root).toMatchRenderedOutput('Not lazy: 0Lazy: 0');

    // Should bailout due to unchanged props and state
    instance1.current.setState(null);
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('Not lazy: 0Lazy: 0');

    // Should bailout due to unchanged props and state
    instance2.current.setState(null);
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('Not lazy: 0Lazy: 0');
  });

  it('resolves defaultProps without breaking bailout in PureComponent, #17151', async () => {
    class LazyImpl extends React.PureComponent {
      static defaultProps = {value: 0};
      state = {};

      render() {
        const text = `${this.props.label}: ${this.props.value}`;
        return <Text text={text} />;
      }
    }

    const Lazy = lazy(() => fakeImport(LazyImpl));

    const instance1 = React.createRef(null);
    const instance2 = React.createRef(null);

    const root = ReactTestRenderer.create(
      <>
        <LazyImpl ref={instance1} label="Not lazy" />
        <Suspense fallback={<Text text="Loading..." />}>
          <Lazy ref={instance2} label="Lazy" />
        </Suspense>
      </>,
      {
        unstable_isConcurrent: true,
      },
    );
    await waitForAll(['Not lazy: 0', 'Loading...']);
    expect(root).not.toMatchRenderedOutput('Not lazy: 0Lazy: 0');

    await resolveFakeImport(LazyImpl);

    await waitForAll(['Lazy: 0']);
    expect(root).toMatchRenderedOutput('Not lazy: 0Lazy: 0');

    // Should bailout due to shallow equal props and state
    instance1.current.setState({});
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('Not lazy: 0Lazy: 0');

    // Should bailout due to shallow equal props and state
    instance2.current.setState({});
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('Not lazy: 0Lazy: 0');
  });

  it('sets defaultProps for modern lifecycles', async () => {
    class C extends React.Component {
      static defaultProps = {text: 'A'};
      state = {};

      static getDerivedStateFromProps(props) {
        Scheduler.log(`getDerivedStateFromProps: ${props.text}`);
        return null;
      }

      constructor(props) {
        super(props);
        Scheduler.log(`constructor: ${this.props.text}`);
      }

      componentDidMount() {
        Scheduler.log(`componentDidMount: ${this.props.text}`);
      }

      componentDidUpdate(prevProps) {
        Scheduler.log(
          `componentDidUpdate: ${prevProps.text} -> ${this.props.text}`,
        );
      }

      componentWillUnmount() {
        Scheduler.log(`componentWillUnmount: ${this.props.text}`);
      }

      shouldComponentUpdate(nextProps) {
        Scheduler.log(
          `shouldComponentUpdate: ${this.props.text} -> ${nextProps.text}`,
        );
        return true;
      }

      getSnapshotBeforeUpdate(prevProps) {
        Scheduler.log(
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

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('A1');

    await resolveFakeImport(C);

    await waitForAll([
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
    await waitForAll([
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
    await waitForAll([
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
        Scheduler.log(`UNSAFE_componentWillMount: ${this.props.text}`);
      }

      UNSAFE_componentWillUpdate(nextProps) {
        Scheduler.log(
          `UNSAFE_componentWillUpdate: ${this.props.text} -> ${nextProps.text}`,
        );
      }

      UNSAFE_componentWillReceiveProps(nextProps) {
        Scheduler.log(
          `UNSAFE_componentWillReceiveProps: ${this.props.text} -> ${nextProps.text}`,
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

    assertLog(['Loading...']);
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('Loading...');

    await resolveFakeImport(C);

    assertLog([]);

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={2} />
      </Suspense>,
    );

    assertLog(['UNSAFE_componentWillMount: A', 'A2']);
    expect(root).toMatchRenderedOutput('A2');

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass num={3} />
      </Suspense>,
    );
    assertLog([
      'UNSAFE_componentWillReceiveProps: A -> A',
      'UNSAFE_componentWillUpdate: A -> A',
      'A3',
    ]);
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('A3');
  });

  it('resolves defaultProps on the outer wrapper but warns', async () => {
    function T(props) {
      Scheduler.log(props.inner + ' ' + props.outer);
      return props.inner + ' ' + props.outer;
    }
    T.defaultProps = {inner: 'Hi'};
    const LazyText = lazy(() => fakeImport(T));
    expect(() => {
      LazyText.defaultProps = {outer: 'Bye'};
    }).toErrorDev(
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

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('Hi Bye');

    await resolveFakeImport(T);
    await expect(async () => await waitForAll(['Hi Bye'])).toErrorDev(
      'Warning: T: Support for defaultProps ' +
        'will be removed from function components in a future major ' +
        'release. Use JavaScript default parameters instead.',
    );

    expect(root).toMatchRenderedOutput('Hi Bye');

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText outer="World" />
      </Suspense>,
    );
    await waitForAll(['Hi World']);
    expect(root).toMatchRenderedOutput('Hi World');

    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyText inner="Friends" />
      </Suspense>,
    );
    await waitForAll(['Friends Bye']);
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

    await waitForAll(['Loading...']);

    await resolveFakeImport(42);
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <BadLazy />
      </Suspense>,
    );
    await waitForThrow(
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

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('Hello');

    await resolveFakeImport(Lazy1);
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <Lazy2 text="Hello" />
      </Suspense>,
    );
    await waitForThrow(
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
    }).toErrorDev(
      'React.lazy(...): It is not supported to assign `propTypes` to ' +
        'a lazy component import. Either specify them where the component ' +
        'is defined, or create a wrapping component around it.',
      {withoutStack: true},
    );
  });

  async function verifyInnerPropTypesAreChecked(
    Add,
    shouldWarnAboutFunctionDefaultProps,
    shouldWarnAboutMemoDefaultProps,
  ) {
    const LazyAdd = lazy(() => fakeImport(Add));
    expect(() => {
      LazyAdd.propTypes = {};
    }).toErrorDev(
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

    await waitForAll(['Loading...']);

    expect(root).not.toMatchRenderedOutput('22');

    // Mount
    await resolveFakeImport(Add);
    await expect(async () => {
      await waitForAll([]);
    }).toErrorDev(
      shouldWarnAboutFunctionDefaultProps
        ? [
            'Add: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
            'Invalid prop `inner` of type `string` supplied to `Add`, expected `number`.',
          ]
        : shouldWarnAboutMemoDefaultProps
        ? [
            'Add: Support for defaultProps will be removed from memo components in a future major release. Use JavaScript default parameters instead.',
            'Invalid prop `inner` of type `string` supplied to `Add`, expected `number`.',
          ]
        : [
            'Invalid prop `inner` of type `string` supplied to `Add`, expected `number`.',
          ],
    );
    expect(root).toMatchRenderedOutput('22');

    // Update
    await expect(async () => {
      root.update(
        <Suspense fallback={<Text text="Loading..." />}>
          <LazyAdd inner={false} outer={false} />
        </Suspense>,
      );
      await waitForAll([]);
    }).toErrorDev(
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
    await verifyInnerPropTypesAreChecked(Add, true);
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
    await verifyInnerPropTypesAreChecked(Add, false, true);
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
    await verifyInnerPropTypesAreChecked(React.memo(Add), true);
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

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('Inner default text');

    // Mount
    await resolveFakeImport(T);
    await expect(async () => {
      await waitForAll(['Inner default text']);
    }).toErrorDev([
      'T: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
      'The prop `text` is marked as required in `T`, but its value is `undefined`',
    ]);
    expect(root).toMatchRenderedOutput('Inner default text');

    // Update
    await expect(async () => {
      root.update(
        <Suspense fallback={<Text text="Loading..." />}>
          <LazyText text={null} />
        </Suspense>,
      );
      await waitForAll([null]);
    }).toErrorDev(
      'The prop `text` is marked as required in `T`, but its value is `null`',
    );
    expect(root).toMatchRenderedOutput(null);
  });

  it('includes lazy-loaded component in warning stack', async () => {
    const Foo = props => <div>{[<Text text="A" />, <Text text="B" />]}</div>;
    const LazyFoo = lazy(() => {
      Scheduler.log('Started loading');
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

    await waitForAll(['Started loading', 'Loading...']);
    expect(root).not.toMatchRenderedOutput(<div>AB</div>);

    await resolveFakeImport(Foo);

    await expect(async () => {
      await waitForAll(['A', 'B']);
    }).toErrorDev('    in Text (at **)\n' + '    in Foo (at **)');
    expect(root).toMatchRenderedOutput(<div>AB</div>);
  });

  it('supports class and forwardRef components', async () => {
    class Foo extends React.Component {
      render() {
        return <Text text="Foo" />;
      }
    }
    const LazyClass = lazy(() => {
      return fakeImport(Foo);
    });

    class Bar extends React.Component {
      render() {
        return <Text text="Bar" />;
      }
    }
    const ForwardRefBar = React.forwardRef((props, ref) => {
      Scheduler.log('forwardRef');
      return <Bar ref={ref} />;
    });

    const LazyForwardRef = lazy(() => {
      return fakeImport(ForwardRefBar);
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

    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('FooBar');
    expect(ref.current).toBe(null);

    await resolveFakeImport(Foo);
    await waitForAll(['Foo']);

    await resolveFakeImport(ForwardRefBar);

    await waitForAll(['Foo', 'forwardRef', 'Bar']);
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
    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('4');

    // Mount
    await resolveFakeImport(Add);
    await expect(async () => {
      await waitForAll([]);
    }).toErrorDev(
      'Unknown: Support for defaultProps will be removed from memo components in a future major release. Use JavaScript default parameters instead.',
    );
    expect(root).toMatchRenderedOutput('4');

    // Update (shallowly equal)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={2} />
      </Suspense>,
    );
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('4');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={3} />
      </Suspense>,
    );
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('5');

    // Update (shallowly equal)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={3} />
      </Suspense>,
    );
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('5');

    // Update (explicit props)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={1} inner={1} />
      </Suspense>,
    );
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('2');

    // Update (explicit props, shallowly equal)
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={1} inner={1} />
      </Suspense>,
    );
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('2');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={1} />
      </Suspense>,
    );
    await waitForAll([]);
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
    await waitForAll(['Loading...']);
    expect(root).not.toMatchRenderedOutput('4');

    // Mount
    await resolveFakeImport(Add);
    await expect(async () => {
      await waitForAll([]);
    }).toErrorDev([
      'Memo: Support for defaultProps will be removed from memo components in a future major release. Use JavaScript default parameters instead.',
      'Unknown: Support for defaultProps will be removed from memo components in a future major release. Use JavaScript default parameters instead.',
    ]);
    expect(root).toMatchRenderedOutput('4');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd outer={3} />
      </Suspense>,
    );
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('5');

    // Update
    root.update(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyAdd />
      </Suspense>,
    );
    await waitForAll([]);
    expect(root).toMatchRenderedOutput('2');
  });

  it('warns about ref on functions for lazy-loaded components', async () => {
    const Foo = props => <div />;
    const LazyFoo = lazy(() => {
      return fakeImport(Foo);
    });

    const ref = React.createRef();
    ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyFoo ref={ref} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    await waitForAll(['Loading...']);
    await resolveFakeImport(Foo);
    await expect(async () => {
      await waitForAll([]);
    }).toErrorDev('Function components cannot be given refs');
  });

  it('should error with a component stack naming the resolved component', async () => {
    let componentStackMessage;

    function ResolvedText() {
      throw new Error('oh no');
    }
    const LazyText = lazy(() => fakeImport(ResolvedText));

    class ErrorBoundary extends React.Component {
      state = {error: null};

      componentDidCatch(error, errMessage) {
        componentStackMessage = normalizeCodeLocInfo(errMessage.componentStack);
        this.setState({
          error,
        });
      }

      render() {
        return this.state.error ? null : this.props.children;
      }
    }

    ReactTestRenderer.create(
      <ErrorBoundary>
        <Suspense fallback={<Text text="Loading..." />}>
          <LazyText text="Hi" />
        </Suspense>
      </ErrorBoundary>,
      {unstable_isConcurrent: true},
    );

    await waitForAll(['Loading...']);

    await resolveFakeImport(ResolvedText);
    await waitForAll([]);

    expect(componentStackMessage).toContain('in ResolvedText');
  });

  it('should error with a component stack containing Lazy if unresolved', () => {
    let componentStackMessage;

    const LazyText = lazy(() => ({
      then(resolve, reject) {
        reject(new Error('oh no'));
      },
    }));

    class ErrorBoundary extends React.Component {
      state = {error: null};

      componentDidCatch(error, errMessage) {
        componentStackMessage = normalizeCodeLocInfo(errMessage.componentStack);
        this.setState({
          error,
        });
      }

      render() {
        return this.state.error ? null : this.props.children;
      }
    }

    ReactTestRenderer.create(
      <ErrorBoundary>
        <Suspense fallback={<Text text="Loading..." />}>
          <LazyText text="Hi" />
        </Suspense>
      </ErrorBoundary>,
    );

    assertLog([]);

    expect(componentStackMessage).toContain('in Lazy');
  });

  it('mount and reorder lazy types', async () => {
    class Child extends React.Component {
      componentWillUnmount() {
        Scheduler.log('Did unmount: ' + this.props.label);
      }
      componentDidMount() {
        Scheduler.log('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        Scheduler.log('Did update: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    function ChildA({lowerCase}) {
      return <Child label={lowerCase ? 'a' : 'A'} />;
    }

    function ChildB({lowerCase}) {
      return <Child label={lowerCase ? 'b' : 'B'} />;
    }

    const LazyChildA = lazy(() => {
      Scheduler.log('Init A');
      return fakeImport(ChildA);
    });
    const LazyChildB = lazy(() => {
      Scheduler.log('Init B');
      return fakeImport(ChildB);
    });
    const LazyChildA2 = lazy(() => {
      Scheduler.log('Init A2');
      return fakeImport(ChildA);
    });
    let resolveB2;
    const LazyChildB2 = lazy(() => {
      Scheduler.log('Init B2');
      return new Promise(r => {
        resolveB2 = r;
      });
    });

    function Parent({swap}) {
      return (
        <Suspense fallback={<Text text="Outer..." />}>
          <Suspense fallback={<Text text="Loading..." />}>
            {swap
              ? [
                  <LazyChildB2 key="B" lowerCase={true} />,
                  <LazyChildA2 key="A" lowerCase={true} />,
                ]
              : [<LazyChildA key="A" />, <LazyChildB key="B" />]}
          </Suspense>
        </Suspense>
      );
    }

    const root = ReactTestRenderer.create(<Parent swap={false} />, {
      unstable_isConcurrent: true,
    });

    await waitForAll(['Init A', 'Loading...']);
    expect(root).not.toMatchRenderedOutput('AB');

    await resolveFakeImport(ChildA);
    await waitForAll(['A', 'Init B']);

    await resolveFakeImport(ChildB);
    await waitForAll(['A', 'B', 'Did mount: A', 'Did mount: B']);
    expect(root).toMatchRenderedOutput('AB');

    // Swap the position of A and B
    root.update(<Parent swap={true} />);
    await waitForAll(['Init B2', 'Loading...']);
    jest.runAllTimers();

    assertLog(['Did unmount: A', 'Did unmount: B']);

    // The suspense boundary should've triggered now.
    expect(root).toMatchRenderedOutput('Loading...');
    await resolveB2({default: ChildB});

    // We need to flush to trigger the second one to load.
    await waitForAll(['Init A2', 'b', 'a', 'Did mount: b', 'Did mount: a']);
    expect(root).toMatchRenderedOutput('ba');
  });

  it('mount and reorder lazy types (legacy mode)', async () => {
    class Child extends React.Component {
      componentDidMount() {
        Scheduler.log('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        Scheduler.log('Did update: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    function ChildA({lowerCase}) {
      return <Child label={lowerCase ? 'a' : 'A'} />;
    }

    function ChildB({lowerCase}) {
      return <Child label={lowerCase ? 'b' : 'B'} />;
    }

    const LazyChildA = lazy(() => {
      Scheduler.log('Init A');
      return fakeImport(ChildA);
    });
    const LazyChildB = lazy(() => {
      Scheduler.log('Init B');
      return fakeImport(ChildB);
    });
    const LazyChildA2 = lazy(() => {
      Scheduler.log('Init A2');
      return fakeImport(ChildA);
    });
    const LazyChildB2 = lazy(() => {
      Scheduler.log('Init B2');
      return fakeImport(ChildB);
    });

    function Parent({swap}) {
      return (
        <Suspense fallback={<Text text="Outer..." />}>
          <Suspense fallback={<Text text="Loading..." />}>
            {swap
              ? [
                  <LazyChildB2 key="B" lowerCase={true} />,
                  <LazyChildA2 key="A" lowerCase={true} />,
                ]
              : [<LazyChildA key="A" />, <LazyChildB key="B" />]}
          </Suspense>
        </Suspense>
      );
    }

    const root = ReactTestRenderer.create(<Parent swap={false} />, {
      unstable_isConcurrent: false,
    });

    assertLog(['Init A', 'Init B', 'Loading...']);
    expect(root).not.toMatchRenderedOutput('AB');

    await resolveFakeImport(ChildA);
    await resolveFakeImport(ChildB);

    await waitForAll(['A', 'B', 'Did mount: A', 'Did mount: B']);
    expect(root).toMatchRenderedOutput('AB');

    // Swap the position of A and B
    root.update(<Parent swap={true} />);
    assertLog(['Init B2', 'Loading...']);
    await waitForAll(['Init A2', 'b', 'a', 'Did update: b', 'Did update: a']);
    expect(root).toMatchRenderedOutput('ba');
  });

  it('mount and reorder lazy elements', async () => {
    class Child extends React.Component {
      componentDidMount() {
        Scheduler.log('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        Scheduler.log('Did update: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    const ChildA = <Child key="A" label="A" />;
    const lazyChildA = lazy(() => {
      Scheduler.log('Init A');
      return fakeImport(ChildA);
    });
    const ChildB = <Child key="B" label="B" />;
    const lazyChildB = lazy(() => {
      Scheduler.log('Init B');
      return fakeImport(ChildB);
    });
    const ChildA2 = <Child key="A" label="a" />;
    const lazyChildA2 = lazy(() => {
      Scheduler.log('Init A2');
      return fakeImport(ChildA2);
    });
    const ChildB2 = <Child key="B" label="b" />;
    const lazyChildB2 = lazy(() => {
      Scheduler.log('Init B2');
      return fakeImport(ChildB2);
    });

    function Parent({swap}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {swap ? [lazyChildB2, lazyChildA2] : [lazyChildA, lazyChildB]}
        </Suspense>
      );
    }

    const root = ReactTestRenderer.create(<Parent swap={false} />, {
      unstable_isConcurrent: true,
    });

    await waitForAll(['Init A', 'Loading...']);
    expect(root).not.toMatchRenderedOutput('AB');

    await resolveFakeImport(ChildA);
    // We need to flush to trigger the B to load.
    await waitForAll(['Init B']);
    await resolveFakeImport(ChildB);

    await waitForAll(['A', 'B', 'Did mount: A', 'Did mount: B']);
    expect(root).toMatchRenderedOutput('AB');

    // Swap the position of A and B
    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        root.update(<Parent swap={true} />);
      });
    } else {
      root.update(<Parent swap={true} />);
    }
    await waitForAll(['Init B2', 'Loading...']);
    await resolveFakeImport(ChildB2);
    // We need to flush to trigger the second one to load.
    await waitForAll(['Init A2', 'Loading...']);
    await resolveFakeImport(ChildA2);

    await waitForAll(['b', 'a', 'Did update: b', 'Did update: a']);
    expect(root).toMatchRenderedOutput('ba');
  });

  it('mount and reorder lazy elements (legacy mode)', async () => {
    class Child extends React.Component {
      componentDidMount() {
        Scheduler.log('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        Scheduler.log('Did update: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    const ChildA = <Child key="A" label="A" />;
    const lazyChildA = lazy(() => {
      Scheduler.log('Init A');
      return fakeImport(ChildA);
    });
    const ChildB = <Child key="B" label="B" />;
    const lazyChildB = lazy(() => {
      Scheduler.log('Init B');
      return fakeImport(ChildB);
    });
    const ChildA2 = <Child key="A" label="a" />;
    const lazyChildA2 = lazy(() => {
      Scheduler.log('Init A2');
      return fakeImport(ChildA2);
    });
    const ChildB2 = <Child key="B" label="b" />;
    const lazyChildB2 = lazy(() => {
      Scheduler.log('Init B2');
      return fakeImport(ChildB2);
    });

    function Parent({swap}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {swap ? [lazyChildB2, lazyChildA2] : [lazyChildA, lazyChildB]}
        </Suspense>
      );
    }

    const root = ReactTestRenderer.create(<Parent swap={false} />, {
      unstable_isConcurrent: false,
    });

    assertLog(['Init A', 'Loading...']);
    expect(root).not.toMatchRenderedOutput('AB');

    await resolveFakeImport(ChildA);
    // We need to flush to trigger the B to load.
    await waitForAll(['Init B']);
    await resolveFakeImport(ChildB);

    await waitForAll(['A', 'B', 'Did mount: A', 'Did mount: B']);
    expect(root).toMatchRenderedOutput('AB');

    // Swap the position of A and B
    root.update(<Parent swap={true} />);
    assertLog(['Init B2', 'Loading...']);
    await resolveFakeImport(ChildB2);
    // We need to flush to trigger the second one to load.
    await waitForAll(['Init A2']);
    await resolveFakeImport(ChildA2);

    await waitForAll(['b', 'a', 'Did update: b', 'Did update: a']);
    expect(root).toMatchRenderedOutput('ba');
  });
});
