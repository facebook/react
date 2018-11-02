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
  let advanceTimeBy;
  let mockNow;
  let Profiler;
  let React;
  let ReactTestRenderer;
  let ReactFeatureFlags;
  let ReactCache;
  let Suspense;
  let TextResource;
  let textResourceShouldFail;

  describe(suiteLabel, () => {
    beforeEach(() => {
      jest.resetModules();

      let currentTime = 0;
      mockNow = jest.fn().mockImplementation(() => currentTime);
      global.Date.now = mockNow;
      advanceTimeBy = amount => {
        currentTime += amount;
      };

      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactFeatureFlags.enableProfilerTimer = true;
      ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
      ReactTestRenderer.unstable_setNowImplementation(mockNow);
      ReactCache = require('react-cache');

      Profiler = React.unstable_Profiler;
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

    function AsyncText({fakeRenderDuration = 0, ms, text}) {
      advanceTimeBy(fakeRenderDuration);
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

    describe('profiler durations', () => {
      let App;
      let Fallback;
      let Suspending;
      let onRender;

      beforeEach(() => {
        // Order of parameters: id, phase, actualDuration, treeBaseDuration
        onRender = jest.fn();

        Fallback = () => {
          ReactTestRenderer.unstable_yield('Fallback');
          advanceTimeBy(5);
          return 'Loading...';
        };

        Suspending = () => {
          ReactTestRenderer.unstable_yield('Suspending');
          advanceTimeBy(2);
          return <AsyncText ms={1000} text="Loaded" fakeRenderDuration={1} />;
        };

        App = () => {
          ReactTestRenderer.unstable_yield('App');
          return (
            <Profiler id="root" onRender={onRender}>
              <Suspense maxDuration={500} fallback={<Fallback />}>
                <Suspending />
              </Suspense>
            </Profiler>
          );
        };
      });

      it('properly accounts for base durations when a suspended times out in a sync tree', () => {
        const root = ReactTestRenderer.create(<App />);
        expect(root.toJSON()).toEqual('Loading...');
        expect(onRender).toHaveBeenCalledTimes(2);

        // Initial mount should be 3ms–
        // 2ms from Suspending, and 1ms from the AsyncText it renders.
        expect(onRender.mock.calls[0][2]).toBe(3);
        expect(onRender.mock.calls[0][3]).toBe(3);

        // When the fallback UI is displayed, and the origina UI hidden,
        // the baseDuration should only include the 5ms spent rendering Fallback,
        // but the treeBaseDuration should include that and the 3ms spent in Suspending.
        expect(onRender.mock.calls[1][2]).toBe(5);
        expect(onRender.mock.calls[1][3]).toBe(8);

        jest.advanceTimersByTime(1000);

        expect(root.toJSON()).toEqual('Loaded');
        expect(onRender).toHaveBeenCalledTimes(3);

        // When the suspending data is resolved and our final UI is rendered,
        // the baseDuration should only include the 1ms re-rendering AsyncText,
        // but the treeBaseDuration should include that and the 2ms spent rendering Suspending.
        expect(onRender.mock.calls[2][2]).toBe(1);
        expect(onRender.mock.calls[2][3]).toBe(3);
      });

      it('properly accounts for base durations when a suspended times out in a concurrent tree', () => {
        const root = ReactTestRenderer.create(<App />, {
          unstable_isConcurrent: true,
        });

        expect(root).toFlushAndYield([
          'App',
          'Suspending',
          'Suspend! [Loaded]',
          'Fallback',
        ]);
        expect(root).toMatchRenderedOutput(null);

        jest.advanceTimersByTime(1000);

        expect(ReactTestRenderer).toHaveYielded(['Promise resolved [Loaded]']);
        expect(root).toMatchRenderedOutput('Loading...');
        expect(onRender).toHaveBeenCalledTimes(1);

        // Initial mount only shows the "Loading..." Fallback.
        // The treeBaseDuration then should be 5ms spent rendering Fallback,
        // but the actualDuration should include that and the 3ms spent in Suspending.
        expect(onRender.mock.calls[0][2]).toBe(8);
        expect(onRender.mock.calls[0][3]).toBe(5);

        expect(root).toFlushAndYield(['Suspending', 'Loaded']);
        expect(root).toMatchRenderedOutput('Loaded');
        expect(onRender).toHaveBeenCalledTimes(2);

        // When the suspending data is resolved and our final UI is rendered,
        // both times should include the 3ms re-rendering Suspending and AsyncText.
        expect(onRender.mock.calls[1][2]).toBe(3);
        expect(onRender.mock.calls[1][3]).toBe(3);
      });
    });
  });
}
