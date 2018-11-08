let React;
let ReactTestRenderer;
let ReactFeatureFlags;
let ReactCache;
let Suspense;

// let JestReact;

let TextResource;
let textResourceShouldFail;

// Additional tests can be found in ReactSuspenseWithNoopRenderer. Plan is
// to gradually migrate those to this file.
describe('ReactSuspense', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactFeatureFlags.enableHooks = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    // JestReact = require('jest-react');
    ReactCache = require('react-cache');

    Suspense = React.Suspense;

    TextResource = ReactCache.unstable_createResource(([text, ms = 0]) => {
      let listeners = null;
      let status = 'pending';
      let value = null;
      return {
        then(resolve, reject) {
          switch (status) {
            case 'pending': {
              if (listeners === null) {
                listeners = [{resolve, reject}];
                setTimeout(() => {
                  if (textResourceShouldFail) {
                    ReactTestRenderer.unstable_yield(
                      `Promise rejected [${text}]`,
                    );
                    status = 'rejected';
                    value = new Error('Failed to load: ' + text);
                    listeners.forEach(listener => listener.reject(value));
                  } else {
                    ReactTestRenderer.unstable_yield(
                      `Promise resolved [${text}]`,
                    );
                    status = 'resolved';
                    value = text;
                    listeners.forEach(listener => listener.resolve(value));
                  }
                }, ms);
              } else {
                listeners.push({resolve, reject});
              }
              break;
            }
            case 'resolved': {
              resolve(value);
              break;
            }
            case 'rejected': {
              reject(value);
              break;
            }
          }
        },
      };
    }, ([text, ms]) => text);
    textResourceShouldFail = false;
  });

  function Text(props) {
    ReactTestRenderer.unstable_yield(props.text);
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read([props.text, props.ms]);
      ReactTestRenderer.unstable_yield(text);
      return text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        ReactTestRenderer.unstable_yield(`Suspend! [${text}]`);
      } else {
        ReactTestRenderer.unstable_yield(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('suspends rendering and continues later', () => {
    function Bar(props) {
      ReactTestRenderer.unstable_yield('Bar');
      return props.children;
    }

    function Foo() {
      ReactTestRenderer.unstable_yield('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Bar>
            <AsyncText text="A" ms={100} />
            <Text text="B" />
          </Bar>
        </Suspense>
      );
    }

    const root = ReactTestRenderer.create(<Foo />, {
      unstable_isConcurrent: true,
    });

    expect(root).toFlushAndYield([
      'Foo',
      'Bar',
      // A suspends
      'Suspend! [A]',
      // But we keep rendering the siblings
      'B',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput(null);

    // Flush some of the time
    jest.advanceTimersByTime(50);
    // Still nothing...
    expect(root).toFlushWithoutYielding();
    expect(root).toMatchRenderedOutput(null);

    // Flush the promise completely
    jest.advanceTimersByTime(50);
    // Renders successfully
    expect(ReactTestRenderer).toHaveYielded(['Promise resolved [A]']);
    expect(root).toFlushAndYield(['Foo', 'Bar', 'A', 'B']);
    expect(root).toMatchRenderedOutput('AB');
  });

  it('suspends siblings and later recovers each independently', () => {
    // Render two sibling Suspense components
    const root = ReactTestRenderer.create(
      <React.Fragment>
        <Suspense maxDuration={1000} fallback={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Suspense>
        <Suspense maxDuration={3000} fallback={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Suspense>
      </React.Fragment>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield([
      'Suspend! [A]',
      'Loading A...',
      'Suspend! [B]',
      'Loading B...',
    ]);
    expect(root).toMatchRenderedOutput(null);

    // Advance time by enough to timeout both components and commit their placeholders
    jest.advanceTimersByTime(4000);
    expect(root).toFlushWithoutYielding();
    expect(root).toMatchRenderedOutput('Loading A...Loading B...');

    // Advance time by enough that the first Suspense's promise resolves and
    // switches back to the normal view. The second Suspense should still
    // show the placeholder
    jest.advanceTimersByTime(1000);
    // TODO: Should we throw if you forget to call toHaveYielded?
    expect(ReactTestRenderer).toHaveYielded(['Promise resolved [A]']);
    expect(root).toFlushAndYield(['A']);
    expect(root).toMatchRenderedOutput('ALoading B...');

    // Advance time by enough that the second Suspense's promise resolves
    // and switches back to the normal view
    jest.advanceTimersByTime(1000);
    expect(ReactTestRenderer).toHaveYielded(['Promise resolved [B]']);
    expect(root).toFlushAndYield(['B']);
    expect(root).toMatchRenderedOutput('AB');
  });

  it('interrupts current render if promise resolves before current render phase', () => {
    let didResolve = false;
    let listeners = [];

    const thenable = {
      then(resolve) {
        if (!didResolve) {
          listeners.push(resolve);
        } else {
          resolve();
        }
      },
    };

    function resolveThenable() {
      didResolve = true;
      listeners.forEach(l => l());
    }

    function Async() {
      if (!didResolve) {
        ReactTestRenderer.unstable_yield('Suspend!');
        throw thenable;
      }
      ReactTestRenderer.unstable_yield('Async');
      return 'Async';
    }

    const root = ReactTestRenderer.create(
      <Suspense maxDuration={1000} fallback={<Text text="Loading..." />}>
        <Async />
        <Text text="Sibling" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYieldThrough(['Suspend!']);

    // The promise resolves before the current render phase has completed
    resolveThenable();
    expect(ReactTestRenderer).toHaveYielded([]);

    // Start over from the root, instead of continuing.
    expect(root).toFlushAndYield([
      // Async renders again *before* Sibling
      'Async',
      'Sibling',
    ]);
    expect(root).toMatchRenderedOutput('AsyncSibling');
  });

  it('mounts a lazy class component in non-concurrent mode', async () => {
    class Class extends React.Component {
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

    async function fakeImport(result) {
      return {default: result};
    }

    const LazyClass = React.lazy(() => fakeImport(Class));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass label="Hi" />
      </Suspense>,
    );

    expect(ReactTestRenderer).toHaveYielded(['Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await LazyClass;

    expect(ReactTestRenderer).toHaveYielded(['Hi', 'Did mount: Hi']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('only captures if `fallback` is defined', () => {
    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <Suspense maxDuration={100}>
          <AsyncText text="Hi" ms={5000} />
        </Suspense>
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(root).toFlushAndYield([
      'Suspend! [Hi]',
      // The outer fallback should be rendered, because the inner one does not
      // have a `fallback` prop
      'Loading...',
    ]);
    jest.advanceTimersByTime(1000);
    expect(ReactTestRenderer).toHaveYielded([]);
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('Loading...');

    jest.advanceTimersByTime(5000);
    expect(ReactTestRenderer).toHaveYielded(['Promise resolved [Hi]']);
    expect(root).toFlushAndYield(['Hi']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('throws if tree suspends and none of the Suspense ancestors have a fallback', () => {
    const root = ReactTestRenderer.create(
      <Suspense>
        <AsyncText text="Hi" ms={1000} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    let err;
    try {
      root.unstable_flushAll();
    } catch (e) {
      err = e;
    }
    expect(err.message.replace(/at .+?:\d+/g, 'at **')).toBe(
      'AsyncText suspended while rendering, but no fallback UI was specified.\n' +
        '\n' +
        'Add a <Suspense fallback=...> component higher in the tree to provide ' +
        'a loading indicator or placeholder to display.\n' +
        (__DEV__ ? '    in AsyncText (at **)\n' : '    in AsyncText\n') +
        (__DEV__ ? '    in Suspense (at **)' : '    in Suspense'),
    );
    expect(ReactTestRenderer).toHaveYielded(['Suspend! [Hi]', 'Suspend! [Hi]']);
  });

  describe('outside concurrent mode', () => {
    it('a mounted class component can suspend without losing state', () => {
      class TextWithLifecycle extends React.Component {
        componentDidMount() {
          ReactTestRenderer.unstable_yield(`Mount [${this.props.text}]`);
        }
        componentDidUpdate() {
          ReactTestRenderer.unstable_yield(`Update [${this.props.text}]`);
        }
        componentWillUnmount() {
          ReactTestRenderer.unstable_yield(`Unmount [${this.props.text}]`);
        }
        render() {
          return <Text {...this.props} />;
        }
      }

      let instance;
      class AsyncTextWithLifecycle extends React.Component {
        state = {step: 1};
        componentDidMount() {
          ReactTestRenderer.unstable_yield(
            `Mount [${this.props.text}:${this.state.step}]`,
          );
        }
        componentDidUpdate() {
          ReactTestRenderer.unstable_yield(
            `Update [${this.props.text}:${this.state.step}]`,
          );
        }
        componentWillUnmount() {
          ReactTestRenderer.unstable_yield(
            `Unmount [${this.props.text}:${this.state.step}]`,
          );
        }
        render() {
          instance = this;
          const text = `${this.props.text}:${this.state.step}`;
          const ms = this.props.ms;
          try {
            TextResource.read([text, ms]);
            ReactTestRenderer.unstable_yield(text);
            return text;
          } catch (promise) {
            if (typeof promise.then === 'function') {
              ReactTestRenderer.unstable_yield(`Suspend! [${text}]`);
            } else {
              ReactTestRenderer.unstable_yield(`Error! [${text}]`);
            }
            throw promise;
          }
        }
      }

      function App() {
        return (
          <Suspense
            maxDuration={1000}
            fallback={<TextWithLifecycle text="Loading..." />}>
            <TextWithLifecycle text="A" />
            <AsyncTextWithLifecycle ms={100} text="B" ref={instance} />
            <TextWithLifecycle text="C" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);

      expect(ReactTestRenderer).toHaveYielded([
        'A',
        'Suspend! [B:1]',
        'C',
        'Loading...',

        'Mount [A]',
        // B's lifecycle should not fire because it suspended
        // 'Mount [B]',
        'Mount [C]',
        'Mount [Loading...]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(100);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [B:1]',
        'B:1',
        'Unmount [Loading...]',
        // Should be a mount, not an update
        'Mount [B:1]',
      ]);

      expect(root).toMatchRenderedOutput('AB:1C');

      instance.setState({step: 2});
      expect(ReactTestRenderer).toHaveYielded([
        'Suspend! [B:2]',
        'Loading...',
        'Mount [Loading...]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(100);

      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [B:2]',
        'B:2',
        'Unmount [Loading...]',
        'Update [B:2]',
      ]);
      expect(root).toMatchRenderedOutput('AB:2C');
    });

    it('bails out on timed-out primary children even if they receive an update', () => {
      let instance;
      class Stateful extends React.Component {
        state = {step: 1};
        render() {
          instance = this;
          return <Text text={`Stateful: ${this.state.step}`} />;
        }
      }

      function App(props) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <Stateful />
            <AsyncText ms={1000} text={props.text} />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App text="A" />);

      expect(ReactTestRenderer).toHaveYielded([
        'Stateful: 1',
        'Suspend! [A]',
        'Loading...',
      ]);

      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [A]', 'A']);
      expect(root).toMatchRenderedOutput('Stateful: 1A');

      root.update(<App text="B" />);
      expect(ReactTestRenderer).toHaveYielded([
        'Stateful: 1',
        'Suspend! [B]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      instance.setState({step: 2});
      expect(ReactTestRenderer).toHaveYielded(['Stateful: 2', 'Suspend! [B]']);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [B]',
        'B',
        'B',
      ]);
      expect(root).toMatchRenderedOutput('Stateful: 2B');
    });

    it('when updating a timed-out tree, always retries the suspended component', () => {
      let instance;
      class Stateful extends React.Component {
        state = {step: 1};
        render() {
          instance = this;
          return <Text text={`Stateful: ${this.state.step}`} />;
        }
      }

      const Indirection = React.Fragment;

      function App(props) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <Stateful />
            <Indirection>
              <Indirection>
                <Indirection>
                  <AsyncText ms={1000} text={props.text} />
                </Indirection>
              </Indirection>
            </Indirection>
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App text="A" />);

      expect(ReactTestRenderer).toHaveYielded([
        'Stateful: 1',
        'Suspend! [A]',
        'Loading...',
      ]);

      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [A]', 'A']);
      expect(root).toMatchRenderedOutput('Stateful: 1A');

      root.update(<App text="B" />);
      expect(ReactTestRenderer).toHaveYielded([
        'Stateful: 1',
        'Suspend! [B]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      instance.setState({step: 2});
      expect(ReactTestRenderer).toHaveYielded([
        'Stateful: 2',

        // The suspended component should suspend again. If it doesn't, the
        // likely mistake is that the suspended fiber wasn't marked with
        // pending work, so it was improperly treated as complete.
        'Suspend! [B]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [B]',
        'B',
        'B',
      ]);
      expect(root).toMatchRenderedOutput('Stateful: 2B');
    });

    it('suspends in a class that has componentWillUnmount and is then deleted', () => {
      class AsyncTextWithUnmount extends React.Component {
        componentWillUnmount() {
          ReactTestRenderer.unstable_yield('will unmount');
        }
        render() {
          const text = this.props.text;
          const ms = this.props.ms;
          try {
            TextResource.read([text, ms]);
            ReactTestRenderer.unstable_yield(text);
            return text;
          } catch (promise) {
            if (typeof promise.then === 'function') {
              ReactTestRenderer.unstable_yield(`Suspend! [${text}]`);
            } else {
              ReactTestRenderer.unstable_yield(`Error! [${text}]`);
            }
            throw promise;
          }
        }
      }

      function App({text}) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncTextWithUnmount text={text} ms={100} />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App text="A" />);
      expect(ReactTestRenderer).toHaveYielded(['Suspend! [A]', 'Loading...']);
      root.update(<Text text="B" />);
      // Should not fire componentWillUnmount
      expect(ReactTestRenderer).toHaveYielded(['B']);
      expect(root).toMatchRenderedOutput('B');
    });

    it('suspends in a component that also contains useEffect', () => {
      const {useLayoutEffect} = React;

      function AsyncTextWithEffect(props) {
        const text = props.text;

        useLayoutEffect(
          () => {
            ReactTestRenderer.unstable_yield('Did commit: ' + text);
          },
          [text],
        );

        try {
          TextResource.read([props.text, props.ms]);
          ReactTestRenderer.unstable_yield(text);
          return text;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            ReactTestRenderer.unstable_yield(`Suspend! [${text}]`);
          } else {
            ReactTestRenderer.unstable_yield(`Error! [${text}]`);
          }
          throw promise;
        }
      }

      function App({text}) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncTextWithEffect text={text} ms={100} />
          </Suspense>
        );
      }

      ReactTestRenderer.create(<App text="A" />);
      expect(ReactTestRenderer).toHaveYielded(['Suspend! [A]', 'Loading...']);
      jest.advanceTimersByTime(500);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [A]',
        'A',
        'Did commit: A',
      ]);
    });

    it('retries when an update is scheduled on a timed out tree', () => {
      let instance;
      class Stateful extends React.Component {
        state = {step: 1};
        render() {
          instance = this;
          return <AsyncText ms={1000} text={`Step: ${this.state.step}`} />;
        }
      }

      function App(props) {
        return (
          <Suspense maxDuration={10} fallback={<Text text="Loading..." />}>
            <Stateful />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      });

      // Initial render
      expect(root).toFlushAndYield(['Suspend! [Step: 1]', 'Loading...']);
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [Step: 1]']);
      expect(root).toFlushAndYield(['Step: 1']);
      expect(root).toMatchRenderedOutput('Step: 1');

      // Update that suspends
      instance.setState({step: 2});
      expect(root).toFlushAndYield(['Suspend! [Step: 2]', 'Loading...']);
      jest.advanceTimersByTime(500);
      expect(root).toMatchRenderedOutput('Loading...');

      // Update while still suspended
      instance.setState({step: 3});
      expect(root).toFlushAndYield(['Suspend! [Step: 3]']);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [Step: 2]',
        'Promise resolved [Step: 3]',
      ]);
      expect(root).toFlushAndYield(['Step: 3']);
      expect(root).toMatchRenderedOutput('Step: 3');
    });

    it('does not remount the fallback while suspended children resolve in sync mode', () => {
      let mounts = 0;
      class ShouldMountOnce extends React.Component {
        componentDidMount() {
          mounts++;
        }
        render() {
          return <Text text="Loading..." />;
        }
      }

      function App(props) {
        return (
          <Suspense maxDuration={10} fallback={<ShouldMountOnce />}>
            <AsyncText ms={1000} text="Child 1" />
            <AsyncText ms={2000} text="Child 2" />
            <AsyncText ms={3000} text="Child 3" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);

      // Initial render
      expect(ReactTestRenderer).toHaveYielded([
        'Suspend! [Child 1]',
        'Suspend! [Child 2]',
        'Suspend! [Child 3]',
        'Loading...',
      ]);
      expect(root).toFlushAndYield([]);
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [Child 1]',
        'Child 1',
        'Suspend! [Child 2]',
        'Suspend! [Child 3]',
      ]);
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [Child 2]',
        'Child 2',
        'Suspend! [Child 3]',
        // TODO: This suspends twice because there were two pings, once for each
        // time Child 2 suspended. This is only an issue in sync mode because
        // pings aren't batched.
        'Suspend! [Child 3]',
      ]);
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [Child 3]',
        'Child 3',
      ]);
      expect(root).toMatchRenderedOutput(
        ['Child 1', 'Child 2', 'Child 3'].join(''),
      );
      expect(mounts).toBe(1);
    });

    it('does not get stuck with fallback in concurrent mode for a large delay', () => {
      function App(props) {
        return (
          <Suspense maxDuration={10} fallback={<Text text="Loading..." />}>
            <AsyncText ms={1000} text="Child 1" />
            <AsyncText ms={7000} text="Child 2" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      });

      expect(root).toFlushAndYield([
        'Suspend! [Child 1]',
        'Suspend! [Child 2]',
        'Loading...',
      ]);
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [Child 1]']);
      expect(root).toFlushAndYield(['Child 1', 'Suspend! [Child 2]']);
      jest.advanceTimersByTime(6000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [Child 2]']);
      expect(root).toFlushAndYield(['Child 1', 'Child 2']);
      expect(root).toMatchRenderedOutput(['Child 1', 'Child 2'].join(''));
    });

    it('reuses effects, including deletions, from the suspended tree', () => {
      const {useState} = React;

      let setTab;
      function App() {
        const [tab, _setTab] = useState(0);
        setTab = _setTab;

        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText key={tab} text={'Tab: ' + tab} ms={1000} />
            <Text key={tab + 'sibling'} text=" + sibling" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);
      expect(ReactTestRenderer).toHaveYielded([
        'Suspend! [Tab: 0]',
        ' + sibling',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [Tab: 0]',
        'Tab: 0',
      ]);
      expect(root).toMatchRenderedOutput('Tab: 0 + sibling');

      setTab(1);
      expect(ReactTestRenderer).toHaveYielded([
        'Suspend! [Tab: 1]',
        ' + sibling',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [Tab: 1]',
        'Tab: 1',
      ]);
      expect(root).toMatchRenderedOutput('Tab: 1 + sibling');

      setTab(2);
      expect(ReactTestRenderer).toHaveYielded([
        'Suspend! [Tab: 2]',
        ' + sibling',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [Tab: 2]',
        'Tab: 2',
      ]);
      expect(root).toMatchRenderedOutput('Tab: 2 + sibling');
    });

    it('does not warn if an mounted component is pinged', () => {
      const {useState} = React;

      const root = ReactTestRenderer.create(null);

      let setStep;
      function UpdatingText({text, ms}) {
        const [step, _setStep] = useState(0);
        setStep = _setStep;
        const fullText = `${text}:${step}`;
        try {
          TextResource.read([fullText, ms]);
          ReactTestRenderer.unstable_yield(fullText);
          return fullText;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            ReactTestRenderer.unstable_yield(`Suspend! [${fullText}]`);
          } else {
            ReactTestRenderer.unstable_yield(`Error! [${fullText}]`);
          }
          throw promise;
        }
      }

      root.update(
        <Suspense fallback={<Text text="Loading..." />}>
          <UpdatingText text="A" ms={1000} />
        </Suspense>,
      );

      expect(ReactTestRenderer).toHaveYielded(['Suspend! [A:0]', 'Loading...']);
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded([
        'Promise resolved [A:0]',
        'A:0',
      ]);
      expect(root).toMatchRenderedOutput('A:0');

      setStep(1);
      expect(ReactTestRenderer).toHaveYielded(['Suspend! [A:1]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      root.update(null);
      expect(root).toFlushWithoutYielding();

      jest.advanceTimersByTime(1000);
    });
  });
});
