let React;
let Suspense;
let ReactNoop;
let Scheduler;
let ReactFeatureFlags;

const fc = require('fast-check');
const prettyFormatPkg = require('pretty-format');

function prettyFormat(thing) {
  return prettyFormatPkg(thing, {
    plugins: [
      prettyFormatPkg.plugins.ReactElement,
      prettyFormatPkg.plugins.ReactTestComponent,
    ],
  });
}

describe('ReactSuspenseFuzz', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');

    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    Suspense = React.Suspense;
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function createFuzzer() {
    const {useState, useContext, useLayoutEffect} = React;

    const ShouldSuspendContext = React.createContext(true);

    let pendingTasks = new Set();
    let cache = new Map();

    function resetCache() {
      pendingTasks = new Set();
      cache = new Map();
    }

    function Container({children, updates}) {
      const [step, setStep] = useState(0);

      useLayoutEffect(() => {
        if (updates !== undefined) {
          const cleanUps = new Set();
          updates.forEach(({remountAfter}, i) => {
            const task = {
              label: `Remount children after ${remountAfter}ms`,
            };
            const timeoutID = setTimeout(() => {
              pendingTasks.delete(task);
              Scheduler.unstable_yieldValue(task.label);
              setStep(i + 1);
            }, remountAfter);
            pendingTasks.add(task);
            cleanUps.add(() => {
              pendingTasks.delete(task);
              clearTimeout(timeoutID);
            });
          });
          return () => {
            cleanUps.forEach(cleanUp => cleanUp());
          };
        }
      }, [updates]);

      return <React.Fragment key={step}>{children}</React.Fragment>;
    }

    function Text({text, initialDelay = 0, updates}) {
      const [[step, delay], setStep] = useState([0, initialDelay]);

      useLayoutEffect(() => {
        if (updates !== undefined) {
          const cleanUps = new Set();
          updates.forEach(({beginAfter, suspendFor}, i) => {
            const task = {
              label: `Update ${beginAfter}ms after mount and suspend for ${suspendFor}ms [${text}]`,
            };
            const timeoutID = setTimeout(() => {
              pendingTasks.delete(task);
              Scheduler.unstable_yieldValue(task.label);
              setStep([i + 1, suspendFor]);
            }, beginAfter);
            pendingTasks.add(task);
            cleanUps.add(() => {
              pendingTasks.delete(task);
              clearTimeout(timeoutID);
            });
          });
          return () => {
            cleanUps.forEach(cleanUp => cleanUp());
          };
        }
      }, [updates]);

      const fullText = `${text}:${step}`;

      const shouldSuspend = useContext(ShouldSuspendContext);

      let resolvedText;
      if (shouldSuspend && delay > 0) {
        resolvedText = cache.get(fullText);
        if (resolvedText === undefined) {
          const thenable = {
            then(resolve) {
              const task = {label: `Promise resolved [${fullText}]`};
              pendingTasks.add(task);
              setTimeout(() => {
                cache.set(fullText, fullText);
                pendingTasks.delete(task);
                Scheduler.unstable_yieldValue(task.label);
                resolve();
              }, delay);
            },
          };
          cache.set(fullText, thenable);
          Scheduler.unstable_yieldValue(`Suspended! [${fullText}]`);
          throw thenable;
        } else if (typeof resolvedText.then === 'function') {
          const thenable = resolvedText;
          Scheduler.unstable_yieldValue(`Suspended! [${fullText}]`);
          throw thenable;
        }
      } else {
        resolvedText = fullText;
      }

      Scheduler.unstable_yieldValue(resolvedText);
      return resolvedText;
    }

    function resolveAllTasks() {
      Scheduler.unstable_flushAllWithoutAsserting();
      let elapsedTime = 0;
      while (pendingTasks && pendingTasks.size > 0) {
        if ((elapsedTime += 1000) > 1000000) {
          throw new Error('Something did not resolve properly.');
        }
        ReactNoop.act(() => jest.advanceTimersByTime(1000));
        Scheduler.unstable_flushAllWithoutAsserting();
      }
    }

    function testResolvedOutput(unwrappedChildren) {
      const children = (
        <Suspense fallback="Loading...">{unwrappedChildren}</Suspense>
      );

      resetCache();
      const expectedRoot = ReactNoop.createRoot();
      expectedRoot.render(
        <ShouldSuspendContext.Provider value={false}>
          {children}
        </ShouldSuspendContext.Provider>,
      );
      resolveAllTasks();
      const expectedOutput = expectedRoot.getChildrenAsJSX();

      resetCache();
      ReactNoop.renderLegacySyncRoot(children);
      resolveAllTasks();
      const legacyOutput = ReactNoop.getChildrenAsJSX();
      expect(legacyOutput).toEqual(expectedOutput);
      ReactNoop.renderLegacySyncRoot(null);

      resetCache();
      const batchedBlockingRoot = ReactNoop.createBlockingRoot();
      batchedBlockingRoot.render(children);
      resolveAllTasks();
      const batchedSyncOutput = batchedBlockingRoot.getChildrenAsJSX();
      expect(batchedSyncOutput).toEqual(expectedOutput);

      resetCache();
      const concurrentRoot = ReactNoop.createRoot();
      concurrentRoot.render(children);
      resolveAllTasks();
      const concurrentOutput = concurrentRoot.getChildrenAsJSX();
      expect(concurrentOutput).toEqual(expectedOutput);
    }

    function testCaseArbitrary() {
      const updatesArbitrary = arb =>
        fc.frequency(
          // Remark: Using a frequency to build an array
          //         Remove the ability to shrink it automatically
          //         But its content remains shrinkable
          {arbitrary: fc.constant([]), weight: 8},
          {arbitrary: fc.array(arb, 1, 1), weight: 4},
          {arbitrary: fc.array(arb, 2, 2), weight: 1},
        );

      const {rootChildrenArbitrary} = fc.letrec(tie => ({
        // Produce one specific type of child
        returnChildArbitrary: fc.constant(null),
        textChildArbitrary: fc
          .tuple(
            fc.hexaString().noShrink(),
            updatesArbitrary(
              fc.record({
                beginAfter: fc.nat(10000),
                suspendFor: fc.nat(10000),
              }),
            ),
            fc.nat(10000),
          )
          .map(([text, updates, initialDelay]) => (
            <Text text={text} initialDelay={initialDelay} updates={updates} />
          )),
        containerChildArbitrary: fc
          .tuple(
            updatesArbitrary(fc.record({remountAfter: fc.nat(10000)})),
            tie('subChildrenArbitrary'),
          )
          .map(([updates, children]) =>
            React.createElement(Container, {updates}, ...children),
          ),
        suspenseChildArbitrary: fc
          .tuple(
            fc.oneof(
              // fallback = none
              fc.constant(undefined),
              // fallback = loading
              fc.constant('Loading...'),
              // fallback = nested suspense
              tie('subChildrenArbitrary').map(children =>
                React.createElement(React.Fragment, null, ...children),
              ),
            ),
            tie('subChildrenArbitrary'),
          )
          .map(([fallback, children]) =>
            React.createElement(Suspense, {fallback}, ...children),
          ),
        // Produce the first child
        childArbitrary: fc.oneof(
          tie('returnChildArbitrary'),
          tie('textChildArbitrary'),
        ),
        // Produce a child with sibling
        childWithSiblingArbitrary: fc.oneof(
          tie('returnChildArbitrary'),
          tie('textChildArbitrary'),
          tie('containerChildArbitrary'),
          tie('suspenseChildArbitrary'),
        ),
        // Produce sub children
        subChildrenArbitrary: fc
          .tuple(
            tie('childArbitrary'),
            fc.array(tie('childWithSiblingArbitrary'), 0, 2),
          )
          .map(([firstChild, others]) => [firstChild, ...others]),
        // Produce the root children
        rootChildrenArbitrary: fc
          .tuple(
            tie('childArbitrary'),
            fc.array(tie('childWithSiblingArbitrary')),
          )
          .map(([firstChild, others]) => [firstChild, ...others]),
      }));

      return rootChildrenArbitrary.map(children => {
        const el = React.createElement(React.Fragment, null, ...children);
        return {
          randomTestCase: React.createElement(
            React.Fragment,
            null,
            ...children,
          ),
          toString: () => prettyFormat(el),
        };
      });
    }

    return {Container, Text, testResolvedOutput, testCaseArbitrary};
  }

  it('basic cases', () => {
    // This demonstrates that the testing primitives work
    const {Container, Text, testResolvedOutput} = createFuzzer();
    testResolvedOutput(
      <Container updates={[{remountAfter: 150}]}>
        <Text
          text="Hi"
          initialDelay={2000}
          updates={[{beginAfter: 100, suspendFor: 200}]}
        />
      </Container>,
    );
  });

  it(`generative tests`, () => {
    const {testCaseArbitrary, testResolvedOutput} = createFuzzer();
    fc.assert(
      fc.property(testCaseArbitrary(), ({randomTestCase}) =>
        testResolvedOutput(randomTestCase),
      ),
    );
  });

  describe('hard-coded cases', () => {
    it('1', () => {
      const {Text, testResolvedOutput} = createFuzzer();
      testResolvedOutput(
        <>
          <Text
            initialDelay={20}
            text="A"
            updates={[{beginAfter: 10, suspendFor: 20}]}
          />
          <Suspense fallback="Loading... (B)">
            <Text
              initialDelay={10}
              text="B"
              updates={[{beginAfter: 30, suspendFor: 50}]}
            />
            <Text text="C" />
          </Suspense>
        </>,
      );
    });

    it('2', () => {
      const {Text, Container, testResolvedOutput} = createFuzzer();
      testResolvedOutput(
        <>
          <Suspense fallback="Loading...">
            <Text initialDelay={7200} text="A" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Container>
              <Text initialDelay={1000} text="B" />
              <Text initialDelay={7200} text="C" />
              <Text initialDelay={9000} text="D" />
            </Container>
          </Suspense>
        </>,
      );
    });

    it('3', () => {
      const {Text, Container, testResolvedOutput} = createFuzzer();
      testResolvedOutput(
        <>
          <Suspense fallback="Loading...">
            <Text
              initialDelay={3183}
              text="A"
              updates={[
                {
                  beginAfter: 2256,
                  suspendFor: 6696,
                },
              ]}
            />
            <Text initialDelay={3251} text="B" />
          </Suspense>
          <Container>
            <Text
              initialDelay={2700}
              text="C"
              updates={[
                {
                  beginAfter: 3266,
                  suspendFor: 9139,
                },
              ]}
            />
            <Text initialDelay={6732} text="D" />
          </Container>
        </>,
      );
    });
  });
});
