/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

runPlaceholderTests('ReactSuspensePlaceholder (mutation)', () =>
  require('react-noop-renderer'),
);
runPlaceholderTests('ReactSuspensePlaceholder (persistence)', () =>
  require('react-noop-renderer/persistent'),
);

function runPlaceholderTests(suiteLabel, loadReactNoop) {
  let React;
  let ReactTestRenderer;
  let ReactFeatureFlags;
  let ReactCache;
  let Suspense;

  let cache;
  let TextResource;
  let textResourceShouldFail;

  describe(suiteLabel, () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
      // JestReact = require('jest-react');
      ReactCache = require('react-cache');

      Suspense = React.Suspense;

      function invalidateCache() {
        cache = ReactCache.createCache(invalidateCache);
      }
      invalidateCache();
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

    it('times out children that are already hidden', () => {
      class HiddenText extends React.PureComponent {
        render() {
          const text = this.props.text;
          ReactTestRenderer.unstable_yield(text);
          return <span hidden={true}>{text}</span>;
        }
      }

      function App(props) {
        return (
          <Suspense maxDuration={500} fallback={<Text text="Loading..." />}>
            <HiddenText text="A" />
            <span>
              <AsyncText ms={1000} text={props.middleText} />
            </span>
            <span>
              <Text text="C" />
            </span>
          </Suspense>
        );
      }

      // Initial mount
      const root = ReactTestRenderer.create(<App middleText="B" />, {
        unstable_isConcurrent: true,
      });

      expect(root).toFlushAndYield(['A', 'Suspend! [B]', 'C', 'Loading...']);
      expect(root).toMatchRenderedOutput(null);

      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [B]']);

      expect(root).toFlushAndYield(['A', 'B', 'C']);

      expect(root).toMatchRenderedOutput(
        <React.Fragment>
          <span hidden={true}>A</span>
          <span>B</span>
          <span>C</span>
        </React.Fragment>,
      );

      // Update
      root.update(<App middleText="B2" />);
      expect(root).toFlushAndYield(['Suspend! [B2]', 'C', 'Loading...']);

      // Time out the update
      jest.advanceTimersByTime(750);
      expect(root).toFlushAndYield([]);
      expect(root).toMatchRenderedOutput('Loading...');

      // Resolve the promise
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [B2]']);
      expect(root).toFlushAndYield(['B2', 'C']);

      // Render the final update. A should still be hidden, because it was
      // given a `hidden` prop.
      expect(root).toMatchRenderedOutput(
        <React.Fragment>
          <span hidden={true}>A</span>
          <span>B2</span>
          <span>C</span>
        </React.Fragment>,
      );
    });

    it('times out text nodes', async () => {
      function App(props) {
        return (
          <Suspense maxDuration={500} fallback={<Text text="Loading..." />}>
            <Text text="A" />
            <AsyncText ms={1000} text={props.middleText} />
            <Text text="C" />
          </Suspense>
        );
      }

      // Initial mount
      const root = ReactTestRenderer.create(<App middleText="B" />, {
        unstable_isConcurrent: true,
      });

      expect(root).toFlushAndYield(['A', 'Suspend! [B]', 'C', 'Loading...']);

      expect(root).toMatchRenderedOutput(null);

      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [B]']);
      expect(root).toFlushAndYield(['A', 'B', 'C']);
      expect(root).toMatchRenderedOutput('ABC');

      // Update
      root.update(<App middleText="B2" />);
      expect(root).toFlushAndYield(['A', 'Suspend! [B2]', 'C', 'Loading...']);
      // Time out the update
      jest.advanceTimersByTime(750);
      expect(root).toFlushAndYield([]);
      expect(root).toMatchRenderedOutput('Loading...');

      // Resolve the promise
      jest.advanceTimersByTime(1000);
      expect(ReactTestRenderer).toHaveYielded(['Promise resolved [B2]']);
      expect(root).toFlushAndYield(['A', 'B2', 'C']);

      // Render the final update. A should still be hidden, because it was
      // given a `hidden` prop.
      expect(root).toMatchRenderedOutput('AB2C');
    });
  });
}
