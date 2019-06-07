let React;
let Suspense;
let ReactNoop;
let Scheduler;
let ReactFeatureFlags;
let Random;

const SEED = process.env.FUZZ_TEST_SEED || 'default';
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
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    Suspense = React.Suspense;
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Random = require('random-seed');
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

      useLayoutEffect(
        () => {
          if (updates !== undefined) {
            const cleanUps = new Set();
            updates.forEach(({remountAfter}, i) => {
              const task = {
                label: `Remount childen after ${remountAfter}ms`,
              };
              const timeoutID = setTimeout(() => {
                pendingTasks.delete(task);
                Scheduler.yieldValue(task.label);
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
        },
        [updates],
      );

      return <React.Fragment key={step}>{children}</React.Fragment>;
    }

    function Text({text, initialDelay = 0, updates}) {
      const [[step, delay], setStep] = useState([0, initialDelay]);

      useLayoutEffect(
        () => {
          if (updates !== undefined) {
            const cleanUps = new Set();
            updates.forEach(({beginAfter, suspendFor}, i) => {
              const task = {
                label: `Update ${beginAfter}ms after mount and suspend for ${suspendFor}ms [${text}]`,
              };
              const timeoutID = setTimeout(() => {
                pendingTasks.delete(task);
                Scheduler.yieldValue(task.label);
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
        },
        [updates],
      );

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
                Scheduler.yieldValue(task.label);
                resolve();
              }, delay);
            },
          };
          cache.set(fullText, thenable);
          Scheduler.yieldValue(`Suspended! [${fullText}]`);
          throw thenable;
        } else if (typeof resolvedText.then === 'function') {
          const thenable = resolvedText;
          Scheduler.yieldValue(`Suspended! [${fullText}]`);
          throw thenable;
        }
      } else {
        resolvedText = fullText;
      }

      Scheduler.yieldValue(resolvedText);
      return resolvedText;
    }

    function resolveAllTasks() {
      Scheduler.unstable_flushWithoutYielding();
      let elapsedTime = 0;
      while (pendingTasks && pendingTasks.size > 0) {
        if ((elapsedTime += 1000) > 1000000) {
          throw new Error('Something did not resolve properly.');
        }
        ReactNoop.act(() => jest.advanceTimersByTime(1000));
        Scheduler.unstable_flushWithoutYielding();
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
      const batchedSyncRoot = ReactNoop.createSyncRoot();
      batchedSyncRoot.render(children);
      resolveAllTasks();
      const batchedSyncOutput = batchedSyncRoot.getChildrenAsJSX();
      expect(batchedSyncOutput).toEqual(expectedOutput);

      resetCache();
      const concurrentRoot = ReactNoop.createRoot();
      concurrentRoot.render(children);
      resolveAllTasks();
      const concurrentOutput = concurrentRoot.getChildrenAsJSX();
      expect(concurrentOutput).toEqual(expectedOutput);
    }

    function pickRandomWeighted(rand, options) {
      let totalWeight = 0;
      for (let i = 0; i < options.length; i++) {
        totalWeight += options[i].weight;
      }
      let remainingWeight = rand.floatBetween(0, totalWeight);
      for (let i = 0; i < options.length; i++) {
        const {value, weight} = options[i];
        remainingWeight -= weight;
        if (remainingWeight <= 0) {
          return value;
        }
      }
    }

    function generateTestCase(rand, numberOfElements) {
      let remainingElements = numberOfElements;

      function createRandomChild(hasSibling) {
        const possibleActions = [
          {value: 'return', weight: 1},
          {value: 'text', weight: 1},
        ];

        if (hasSibling) {
          possibleActions.push({value: 'container', weight: 1});
          possibleActions.push({value: 'suspense', weight: 1});
        }

        const action = pickRandomWeighted(rand, possibleActions);

        switch (action) {
          case 'text': {
            remainingElements--;

            const numberOfUpdates = pickRandomWeighted(rand, [
              {value: 0, weight: 8},
              {value: 1, weight: 4},
              {value: 2, weight: 1},
            ]);

            let updates = [];
            for (let i = 0; i < numberOfUpdates; i++) {
              updates.push({
                beginAfter: rand.intBetween(0, 10000),
                suspendFor: rand.intBetween(0, 10000),
              });
            }

            return (
              <Text
                text={(remainingElements + 9).toString(36).toUpperCase()}
                initialDelay={rand.intBetween(0, 10000)}
                updates={updates}
              />
            );
          }
          case 'container': {
            const numberOfUpdates = pickRandomWeighted(rand, [
              {value: 0, weight: 8},
              {value: 1, weight: 4},
              {value: 2, weight: 1},
            ]);

            let updates = [];
            for (let i = 0; i < numberOfUpdates; i++) {
              updates.push({
                remountAfter: rand.intBetween(0, 10000),
              });
            }

            remainingElements--;
            const children = createRandomChildren(3);
            return React.createElement(Container, {updates}, ...children);
          }
          case 'suspense': {
            remainingElements--;
            const children = createRandomChildren(3);

            const fallbackType = pickRandomWeighted(rand, [
              {value: 'none', weight: 1},
              {value: 'normal', weight: 1},
              {value: 'nested suspense', weight: 1},
            ]);

            let fallback;
            if (fallbackType === 'normal') {
              fallback = 'Loading...';
            } else if (fallbackType === 'nested suspense') {
              fallback = React.createElement(
                React.Fragment,
                null,
                ...createRandomChildren(3),
              );
            }

            return React.createElement(Suspense, {fallback}, ...children);
          }
          case 'return':
          default:
            return null;
        }
      }

      function createRandomChildren(limit) {
        const children = [];
        while (remainingElements > 0 && children.length < limit) {
          children.push(createRandomChild(children.length > 0));
        }
        return children;
      }

      const children = createRandomChildren(Infinity);
      return React.createElement(React.Fragment, null, ...children);
    }

    return {Container, Text, testResolvedOutput, generateTestCase};
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

  it(`generative tests (random seed: ${SEED})`, () => {
    const {generateTestCase, testResolvedOutput} = createFuzzer();

    const rand = Random.create(SEED);

    const NUMBER_OF_TEST_CASES = 500;
    const ELEMENTS_PER_CASE = 12;

    for (let i = 0; i < NUMBER_OF_TEST_CASES; i++) {
      const randomTestCase = generateTestCase(rand, ELEMENTS_PER_CASE);
      try {
        testResolvedOutput(randomTestCase);
      } catch (e) {
        console.log(`
Failed fuzzy test case:

${prettyFormat(randomTestCase)}

Random seed is ${SEED}
`);

        throw e;
      }
    }
  });

  describe('hard-coded cases', () => {
    it('1', () => {
      const {Text, testResolvedOutput} = createFuzzer();
      testResolvedOutput(
        <React.Fragment>
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
        </React.Fragment>,
      );
    });

    it('2', () => {
      const {Text, Container, testResolvedOutput} = createFuzzer();
      testResolvedOutput(
        <React.Fragment>
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
        </React.Fragment>,
      );
    });

    it('3', () => {
      const {Text, Container, testResolvedOutput} = createFuzzer();
      testResolvedOutput(
        <React.Fragment>
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
        </React.Fragment>,
      );
    });
  });
});
