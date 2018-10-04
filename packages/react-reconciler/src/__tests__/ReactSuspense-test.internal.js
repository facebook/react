let React;
let ReactTestRenderer;
let ReactFeatureFlags;
let ReactCache;
let Placeholder;

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
    ReactFeatureFlags.enableSuspense = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    // JestReact = require('jest-react');
    ReactCache = require('react-cache');

    Placeholder = React.Placeholder;

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
        <Placeholder>
          <Bar>
            <AsyncText text="A" ms={100} />
            <Text text="B" />
          </Bar>
        </Placeholder>
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
    // Render two sibling Placeholder components
    const root = ReactTestRenderer.create(
      <React.Fragment>
        <Placeholder delayMs={1000} fallback={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Placeholder>
        <Placeholder delayMs={3000} fallback={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Placeholder>
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

    // Advance time by enough that the first Placeholder's promise resolves and
    // switches back to the normal view. The second Placeholder should still
    // show the placeholder
    jest.advanceTimersByTime(1000);
    // TODO: Should we throw if you forget to call toHaveYielded?
    expect(ReactTestRenderer).toHaveYielded(['Promise resolved [A]']);
    expect(root).toFlushAndYield(['A']);
    expect(root).toMatchRenderedOutput('ALoading B...');

    // Advance time by enough that the second Placeholder's promise resolves
    // and switches back to the normal view
    jest.advanceTimersByTime(1000);
    expect(ReactTestRenderer).toHaveYielded(['Promise resolved [B]']);
    expect(root).toFlushAndYield(['B']);
    expect(root).toMatchRenderedOutput('AB');
  });
});
