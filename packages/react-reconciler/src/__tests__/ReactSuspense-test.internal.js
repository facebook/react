let React;
let ReactTestRenderer;
let ReactFeatureFlags;
let ReactCache;
let Suspense;

// let JestReact;

let cache;
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
    // JestReact = require('jest-react');
    ReactCache = require('react-cache');

    Suspense = React.unstable_Suspense;

    function invalidateCache() {
      cache = ReactCache.createCache(invalidateCache);
    }
    invalidateCache();
    TextResource = ReactCache.createResource(([text, ms = 0]) => {
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
      TextResource.read(cache, [props.text, props.ms]);
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
        <Suspense>
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
});
