let React;
let ReactTestRenderer;
let ReactFeatureFlags;
let Scheduler;
let ReactCache;
let Suspense;
let act;
let enableNewScheduler;

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
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    act = ReactTestRenderer.act;
    Scheduler = require('scheduler');
    ReactCache = require('react-cache');
    enableNewScheduler = ReactFeatureFlags.enableNewScheduler;

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
                    Scheduler.yieldValue(`Promise rejected [${text}]`);
                    status = 'rejected';
                    value = new Error('Failed to load: ' + text);
                    listeners.forEach(listener => listener.reject(value));
                  } else {
                    Scheduler.yieldValue(`Promise resolved [${text}]`);
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
    Scheduler.yieldValue(props.text);
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read([props.text, props.ms]);
      Scheduler.yieldValue(text);
      return text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.yieldValue(`Suspend! [${text}]`);
      } else {
        Scheduler.yieldValue(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('suspends rendering and continues later', () => {
    function Bar(props) {
      Scheduler.yieldValue('Bar');
      return props.children;
    }

    function Foo() {
      Scheduler.yieldValue('Foo');
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

    expect(Scheduler).toFlushAndYield([
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
    expect(Scheduler).toFlushWithoutYielding();
    expect(root).toMatchRenderedOutput(null);

    // Flush the promise completely
    jest.advanceTimersByTime(50);
    // Renders successfully
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['Foo', 'Bar', 'A', 'B']);
    expect(root).toMatchRenderedOutput('AB');
  });

  it('suspends siblings and later recovers each independently', () => {
    // Render two sibling Suspense components
    const root = ReactTestRenderer.create(
      <React.Fragment>
        <Suspense fallback={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Suspense>
        <Suspense fallback={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Suspense>
      </React.Fragment>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      'Loading A...',
      'Suspend! [B]',
      'Loading B...',
    ]);
    expect(root).toMatchRenderedOutput(null);

    // Advance time by enough to timeout both components and commit their placeholders
    jest.advanceTimersByTime(4000);
    expect(Scheduler).toFlushWithoutYielding();
    expect(root).toMatchRenderedOutput('Loading A...Loading B...');

    // Advance time by enough that the first Suspense's promise resolves and
    // switches back to the normal view. The second Suspense should still
    // show the placeholder
    jest.advanceTimersByTime(1000);
    // TODO: Should we throw if you forget to call toHaveYielded?
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['A']);
    expect(root).toMatchRenderedOutput('ALoading B...');

    // Advance time by enough that the second Suspense's promise resolves
    // and switches back to the normal view
    jest.advanceTimersByTime(1000);
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(Scheduler).toFlushAndYield(['B']);
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
        Scheduler.yieldValue('Suspend!');
        throw thenable;
      }
      Scheduler.yieldValue('Async');
      return 'Async';
    }

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <Async />
        <Text text="Sibling" />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(Scheduler).toFlushAndYieldThrough(['Suspend!']);

    // The promise resolves before the current render phase has completed
    resolveThenable();
    expect(Scheduler).toHaveYielded([]);

    // Start over from the root, instead of continuing.
    expect(Scheduler).toFlushAndYield([
      // Async renders again *before* Sibling
      'Async',
      'Sibling',
    ]);
    expect(root).toMatchRenderedOutput('AsyncSibling');
  });

  it('mounts a lazy class component in non-concurrent mode', async () => {
    class Class extends React.Component {
      componentDidMount() {
        Scheduler.yieldValue('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        Scheduler.yieldValue('Did update: ' + this.props.label);
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

    expect(Scheduler).toHaveYielded(['Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await LazyClass;

    if (enableNewScheduler) {
      expect(Scheduler).toFlushExpired(['Hi', 'Did mount: Hi']);
    } else {
      expect(Scheduler).toHaveYielded(['Hi', 'Did mount: Hi']);
    }
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('only captures if `fallback` is defined', () => {
    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <Suspense>
          <AsyncText text="Hi" ms={5000} />
        </Suspense>
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [Hi]',
      // The outer fallback should be rendered, because the inner one does not
      // have a `fallback` prop
      'Loading...',
    ]);
    jest.advanceTimersByTime(1000);
    expect(Scheduler).toHaveYielded([]);
    expect(Scheduler).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('Loading...');

    jest.advanceTimersByTime(5000);
    expect(Scheduler).toHaveYielded(['Promise resolved [Hi]']);
    expect(Scheduler).toFlushAndYield(['Hi']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('throws if tree suspends and none of the Suspense ancestors have a fallback', () => {
    ReactTestRenderer.create(
      <Suspense>
        <AsyncText text="Hi" ms={1000} />
      </Suspense>,
      {
        unstable_isConcurrent: true,
      },
    );

    expect(Scheduler).toFlushAndThrow(
      'AsyncText suspended while rendering, but no fallback UI was specified.',
    );
    expect(Scheduler).toHaveYielded(['Suspend! [Hi]', 'Suspend! [Hi]']);
  });

  describe('outside concurrent mode', () => {
    it('a mounted class component can suspend without losing state', () => {
      class TextWithLifecycle extends React.Component {
        componentDidMount() {
          Scheduler.yieldValue(`Mount [${this.props.text}]`);
        }
        componentDidUpdate() {
          Scheduler.yieldValue(`Update [${this.props.text}]`);
        }
        componentWillUnmount() {
          Scheduler.yieldValue(`Unmount [${this.props.text}]`);
        }
        render() {
          return <Text {...this.props} />;
        }
      }

      let instance;
      class AsyncTextWithLifecycle extends React.Component {
        state = {step: 1};
        componentDidMount() {
          Scheduler.yieldValue(`Mount [${this.props.text}:${this.state.step}]`);
        }
        componentDidUpdate() {
          Scheduler.yieldValue(
            `Update [${this.props.text}:${this.state.step}]`,
          );
        }
        componentWillUnmount() {
          Scheduler.yieldValue(
            `Unmount [${this.props.text}:${this.state.step}]`,
          );
        }
        render() {
          instance = this;
          const text = `${this.props.text}:${this.state.step}`;
          const ms = this.props.ms;
          try {
            TextResource.read([text, ms]);
            Scheduler.yieldValue(text);
            return text;
          } catch (promise) {
            if (typeof promise.then === 'function') {
              Scheduler.yieldValue(`Suspend! [${text}]`);
            } else {
              Scheduler.yieldValue(`Error! [${text}]`);
            }
            throw promise;
          }
        }
      }

      function App() {
        return (
          <Suspense fallback={<TextWithLifecycle text="Loading..." />}>
            <TextWithLifecycle text="A" />
            <AsyncTextWithLifecycle ms={100} text="B" ref={instance} />
            <TextWithLifecycle text="C" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);

      expect(Scheduler).toHaveYielded([
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

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [B:1]']);
        expect(Scheduler).toFlushExpired([
          'B:1',
          'Unmount [Loading...]',
          // Should be a mount, not an update
          'Mount [B:1]',
        ]);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [B:1]',
          'B:1',
          'Unmount [Loading...]',
          // Should be a mount, not an update
          'Mount [B:1]',
        ]);
      }

      expect(root).toMatchRenderedOutput('AB:1C');

      instance.setState({step: 2});
      expect(Scheduler).toHaveYielded([
        'Suspend! [B:2]',
        'Loading...',
        'Mount [Loading...]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(100);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [B:2]']);
        expect(Scheduler).toFlushExpired([
          'B:2',
          'Unmount [Loading...]',
          'Update [B:2]',
        ]);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [B:2]',
          'B:2',
          'Unmount [Loading...]',
          'Update [B:2]',
        ]);
      }
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

      expect(Scheduler).toHaveYielded([
        'Stateful: 1',
        'Suspend! [A]',
        'Loading...',
      ]);

      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
        expect(Scheduler).toFlushExpired(['A']);
      } else {
        expect(Scheduler).toHaveYielded(['Promise resolved [A]', 'A']);
      }

      expect(root).toMatchRenderedOutput('Stateful: 1A');

      root.update(<App text="B" />);
      expect(Scheduler).toHaveYielded([
        'Stateful: 1',
        'Suspend! [B]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      instance.setState({step: 2});
      expect(Scheduler).toHaveYielded(['Stateful: 2', 'Suspend! [B]']);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
        expect(Scheduler).toFlushExpired(['B']);
      } else {
        expect(Scheduler).toHaveYielded(['Promise resolved [B]', 'B']);
      }

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

      expect(Scheduler).toHaveYielded([
        'Stateful: 1',
        'Suspend! [A]',
        'Loading...',
      ]);

      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
        expect(Scheduler).toFlushExpired(['A']);
      } else {
        expect(Scheduler).toHaveYielded(['Promise resolved [A]', 'A']);
      }
      expect(root).toMatchRenderedOutput('Stateful: 1A');

      root.update(<App text="B" />);
      expect(Scheduler).toHaveYielded([
        'Stateful: 1',
        'Suspend! [B]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      instance.setState({step: 2});
      expect(Scheduler).toHaveYielded([
        'Stateful: 2',

        // The suspended component should suspend again. If it doesn't, the
        // likely mistake is that the suspended fiber wasn't marked with
        // pending work, so it was improperly treated as complete.
        'Suspend! [B]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
        expect(Scheduler).toFlushExpired(['B']);
      } else {
        expect(Scheduler).toHaveYielded(['Promise resolved [B]', 'B']);
      }

      expect(root).toMatchRenderedOutput('Stateful: 2B');
    });

    it('suspends in a class that has componentWillUnmount and is then deleted', () => {
      class AsyncTextWithUnmount extends React.Component {
        componentWillUnmount() {
          Scheduler.yieldValue('will unmount');
        }
        render() {
          const text = this.props.text;
          const ms = this.props.ms;
          try {
            TextResource.read([text, ms]);
            Scheduler.yieldValue(text);
            return text;
          } catch (promise) {
            if (typeof promise.then === 'function') {
              Scheduler.yieldValue(`Suspend! [${text}]`);
            } else {
              Scheduler.yieldValue(`Error! [${text}]`);
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
      expect(Scheduler).toHaveYielded(['Suspend! [A]', 'Loading...']);
      root.update(<Text text="B" />);
      // Should not fire componentWillUnmount
      expect(Scheduler).toHaveYielded(['B']);
      expect(root).toMatchRenderedOutput('B');
    });

    it('suspends in a component that also contains useEffect', () => {
      const {useLayoutEffect} = React;

      function AsyncTextWithEffect(props) {
        const text = props.text;

        useLayoutEffect(
          () => {
            Scheduler.yieldValue('Did commit: ' + text);
          },
          [text],
        );

        try {
          TextResource.read([props.text, props.ms]);
          Scheduler.yieldValue(text);
          return text;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.yieldValue(`Suspend! [${text}]`);
          } else {
            Scheduler.yieldValue(`Error! [${text}]`);
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
      expect(Scheduler).toHaveYielded(['Suspend! [A]', 'Loading...']);
      jest.advanceTimersByTime(500);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
        expect(Scheduler).toFlushExpired(['A', 'Did commit: A']);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [A]',
          'A',
          'Did commit: A',
        ]);
      }
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
          <Suspense fallback={<Text text="Loading..." />}>
            <Stateful />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      });

      // Initial render
      expect(Scheduler).toFlushAndYield(['Suspend! [Step: 1]', 'Loading...']);
      jest.advanceTimersByTime(1000);
      expect(Scheduler).toHaveYielded(['Promise resolved [Step: 1]']);
      expect(Scheduler).toFlushAndYield(['Step: 1']);
      expect(root).toMatchRenderedOutput('Step: 1');

      // Update that suspends
      instance.setState({step: 2});
      expect(Scheduler).toFlushAndYield(['Suspend! [Step: 2]', 'Loading...']);
      jest.advanceTimersByTime(500);
      expect(root).toMatchRenderedOutput('Loading...');

      // Update while still suspended
      instance.setState({step: 3});
      expect(Scheduler).toFlushAndYield(['Suspend! [Step: 3]']);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);
      expect(Scheduler).toHaveYielded([
        'Promise resolved [Step: 2]',
        'Promise resolved [Step: 3]',
      ]);
      expect(Scheduler).toFlushAndYield(['Step: 3']);
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
          <Suspense fallback={<ShouldMountOnce />}>
            <AsyncText ms={1000} text="Child 1" />
            <AsyncText ms={2000} text="Child 2" />
            <AsyncText ms={3000} text="Child 3" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);

      // Initial render
      expect(Scheduler).toHaveYielded([
        'Suspend! [Child 1]',
        'Suspend! [Child 2]',
        'Suspend! [Child 3]',
        'Loading...',
      ]);
      expect(Scheduler).toFlushAndYield([]);
      jest.advanceTimersByTime(1000);
      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [Child 1]']);
        expect(Scheduler).toFlushExpired([
          'Child 1',
          'Suspend! [Child 2]',
          'Suspend! [Child 3]',
        ]);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [Child 1]',
          'Child 1',
          'Suspend! [Child 2]',
          'Suspend! [Child 3]',
        ]);
      }
      jest.advanceTimersByTime(1000);
      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [Child 2]']);
        expect(Scheduler).toFlushExpired(['Child 2', 'Suspend! [Child 3]']);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [Child 2]',
          'Child 2',
          'Suspend! [Child 3]',
        ]);
      }
      jest.advanceTimersByTime(1000);
      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [Child 3]']);
        expect(Scheduler).toFlushExpired(['Child 3']);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [Child 3]',
          'Child 3',
        ]);
      }
      expect(root).toMatchRenderedOutput(
        ['Child 1', 'Child 2', 'Child 3'].join(''),
      );
      expect(mounts).toBe(1);
    });

    it('does not get stuck with fallback in concurrent mode for a large delay', () => {
      function App(props) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText ms={1000} text="Child 1" />
            <AsyncText ms={7000} text="Child 2" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      });

      expect(Scheduler).toFlushAndYield([
        'Suspend! [Child 1]',
        'Suspend! [Child 2]',
        'Loading...',
      ]);
      jest.advanceTimersByTime(1000);
      expect(Scheduler).toHaveYielded(['Promise resolved [Child 1]']);
      expect(Scheduler).toFlushAndYield(['Child 1', 'Suspend! [Child 2]']);
      jest.advanceTimersByTime(6000);
      expect(Scheduler).toHaveYielded(['Promise resolved [Child 2]']);
      expect(Scheduler).toFlushAndYield(['Child 1', 'Child 2']);
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
      expect(Scheduler).toHaveYielded([
        'Suspend! [Tab: 0]',
        ' + sibling',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [Tab: 0]']);
        expect(Scheduler).toFlushExpired(['Tab: 0']);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [Tab: 0]',
          'Tab: 0',
        ]);
      }
      expect(root).toMatchRenderedOutput('Tab: 0 + sibling');

      act(() => setTab(1));
      expect(Scheduler).toHaveYielded([
        'Suspend! [Tab: 1]',
        ' + sibling',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [Tab: 1]']);
        expect(Scheduler).toFlushExpired(['Tab: 1']);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [Tab: 1]',
          'Tab: 1',
        ]);
      }

      expect(root).toMatchRenderedOutput('Tab: 1 + sibling');

      act(() => setTab(2));
      expect(Scheduler).toHaveYielded([
        'Suspend! [Tab: 2]',
        ' + sibling',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [Tab: 2]']);
        expect(Scheduler).toFlushExpired(['Tab: 2']);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [Tab: 2]',
          'Tab: 2',
        ]);
      }

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
          Scheduler.yieldValue(fullText);
          return fullText;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.yieldValue(`Suspend! [${fullText}]`);
          } else {
            Scheduler.yieldValue(`Error! [${fullText}]`);
          }
          throw promise;
        }
      }

      root.update(
        <Suspense fallback={<Text text="Loading..." />}>
          <UpdatingText text="A" ms={1000} />
        </Suspense>,
      );

      expect(Scheduler).toHaveYielded(['Suspend! [A:0]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [A:0]']);
        expect(Scheduler).toFlushExpired(['A:0']);
      } else {
        expect(Scheduler).toHaveYielded(['Promise resolved [A:0]', 'A:0']);
      }

      expect(root).toMatchRenderedOutput('A:0');

      act(() => setStep(1));
      expect(Scheduler).toHaveYielded(['Suspend! [A:1]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      root.update(null);
      expect(Scheduler).toFlushWithoutYielding();
      jest.advanceTimersByTime(1000);
    });

    it('memoizes promise listeners per thread ID to prevent redundant renders', () => {
      function App() {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="A" ms={1000} />
            <AsyncText text="B" ms={2000} />
            <AsyncText text="C" ms={3000} />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(null);

      root.update(<App />);

      expect(Scheduler).toHaveYielded([
        'Suspend! [A]',
        'Suspend! [B]',
        'Suspend! [C]',
        'Loading...',
      ]);

      // Resolve A
      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
        expect(Scheduler).toFlushExpired([
          'A',
          // The promises for B and C have now been thrown twice
          'Suspend! [B]',
          'Suspend! [C]',
        ]);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [A]',
          'A',
          // The promises for B and C have now been thrown twice
          'Suspend! [B]',
          'Suspend! [C]',
        ]);
      }

      // Resolve B
      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
        expect(Scheduler).toFlushExpired([
          // Even though the promise for B was thrown twice, we should only
          // re-render once.
          'B',
          // The promise for C has now been thrown three times
          'Suspend! [C]',
        ]);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [B]',
          // Even though the promise for B was thrown twice, we should only
          // re-render once.
          'B',
          // The promise for C has now been thrown three times
          'Suspend! [C]',
        ]);
      }

      // Resolve C
      jest.advanceTimersByTime(1000);

      if (enableNewScheduler) {
        expect(Scheduler).toHaveYielded(['Promise resolved [C]']);
        expect(Scheduler).toFlushExpired([
          // Even though the promise for C was thrown three times, we should only
          // re-render once.
          'C',
        ]);
      } else {
        expect(Scheduler).toHaveYielded([
          'Promise resolved [C]',
          // Even though the promise for C was thrown three times, we should only
          // re-render once.
          'C',
        ]);
      }
    });

    it('#14162', () => {
      const {lazy} = React;

      function Hello() {
        return <span>hello</span>;
      }

      async function fetchComponent() {
        return new Promise(r => {
          // simulating a delayed import() call
          setTimeout(r, 1000, {default: Hello});
        });
      }

      const LazyHello = lazy(fetchComponent);

      class App extends React.Component {
        state = {render: false};

        componentDidMount() {
          setTimeout(() => this.setState({render: true}));
        }

        render() {
          return (
            <Suspense fallback={<span>loading...</span>}>
              {this.state.render && <LazyHello />}
            </Suspense>
          );
        }
      }

      const root = ReactTestRenderer.create(null);

      root.update(<App name="world" />);
      jest.advanceTimersByTime(1000);
    });
  });
});
