/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactTestRenderer;

function loadModules({
  enableProfileModeMetrics = true,
  replayFailedUnitOfWorkWithInvokeGuardedCallback = false,
} = {}) {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.debugRenderPhaseSideEffects = false;
  ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
  ReactFeatureFlags.enableProfileModeMetrics = enableProfileModeMetrics;
  ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = replayFailedUnitOfWorkWithInvokeGuardedCallback;
  React = require('react');
  ReactTestRenderer = require('react-test-renderer');
}

describe('ProfileRoot', () => {
  describe('works in profiling and non-profiling bundles', () => {
    [true, false].forEach(flagEnabled => {
      describe(`enableProfileModeMetrics ${
        flagEnabled ? 'enabled' : 'disabled'
      }`, () => {
        beforeEach(() => {
          jest.resetModules();

          loadModules({enableProfileModeMetrics: flagEnabled});
        });

        // This will throw in production too,
        // But the test is only interested in verifying the DEV error message.
        if (__DEV__) {
          it('should warn if required params are missing', () => {
            expect(() => {
              ReactTestRenderer.create(<React.unstable_ProfileRoot />);
            }).toThrow(
              'ProfileMode must specify a label string and callback function',
            );
          });
        }

        it('should support an empty ProfileRoot (with no children)', () => {
          // As root
          expect(
            ReactTestRenderer.create(
              <React.unstable_ProfileRoot label="label" callback={() => {}} />,
            ).toJSON(),
          ).toMatchSnapshot();

          // As non-root
          expect(
            ReactTestRenderer.create(
              <div>
                <React.unstable_ProfileRoot label="label" callback={() => {}} />
              </div>,
            ).toJSON(),
          ).toMatchSnapshot();
        });

        it('should render children', () => {
          const FunctionalComponent = ({label}) => <span>{label}</span>;
          const renderer = ReactTestRenderer.create(
            <div>
              <span>outside span</span>
              <React.unstable_ProfileRoot label="label" callback={() => {}}>
                <span>inside span</span>
                <FunctionalComponent label="functional component" />
              </React.unstable_ProfileRoot>
            </div>,
          );
          expect(renderer.toJSON()).toMatchSnapshot();
        });

        it('should support nested ProfileModes', () => {
          const FunctionalComponent = ({label}) => <div>{label}</div>;
          class ClassComponent extends React.Component {
            render() {
              return <block>{this.props.label}</block>;
            }
          }
          const renderer = ReactTestRenderer.create(
            <React.unstable_ProfileRoot label="outer" callback={() => {}}>
              <FunctionalComponent label="outer functional component" />
              <React.unstable_ProfileRoot label="inner" callback={() => {}}>
                <ClassComponent label="inner class component" />
                <span>inner span</span>
              </React.unstable_ProfileRoot>
            </React.unstable_ProfileRoot>,
          );
          expect(renderer.toJSON()).toMatchSnapshot();
        });
      });
    });
  });

  describe('records meaningful timing information', () => {
    let AdvanceTime;
    let advanceTimeBy;

    beforeEach(() => {
      jest.resetModules();

      let currentTime = 0;
      global.performance = {
        now: () => {
          return currentTime;
        },
      };
      advanceTimeBy = amount => {
        currentTime += amount;
      };

      // Import after polyfill
      loadModules();

      AdvanceTime = class extends React.Component {
        static defaultProps = {
          byAmount: 10,
          shouldComponentUpdate: true,
        };
        shouldComponentUpdate(nextProps) {
          return nextProps.shouldComponentUpdate;
        }
        render() {
          // Simulate time passing when this component is rendered
          advanceTimeBy(this.props.byAmount);
          return this.props.children || null;
        }
      };
    });
    afterEach(() => {
      delete global.performance;
    });

    it('does not invoke the callback until the commit phase', () => {
      const callback = jest.fn();

      const Yield = ({value}) => {
        renderer.unstable_yield(value);
        return null;
      };

      const renderer = ReactTestRenderer.create(
        <React.unstable_ProfileRoot label="test" callback={callback}>
          <Yield value="first" />
          <Yield value="last" />
        </React.unstable_ProfileRoot>,
        {
          unstable_isAsync: true,
        },
      );

      // Times are logged until a render is committed.
      renderer.unstable_flushThrough(['first']);
      expect(callback).toHaveBeenCalledTimes(0);
      expect(renderer.unstable_flushAll()).toEqual(['last']);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('logs render times for both mount and update', () => {
      const callback = jest.fn();

      const renderer = ReactTestRenderer.create(
        <React.unstable_ProfileRoot label="test" callback={callback}>
          <AdvanceTime />
        </React.unstable_ProfileRoot>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      let [call] = callback.mock.calls;

      expect(call).toHaveLength(4);
      expect(call[0]).toBe('test');
      expect(call[1]).toBe('mount');
      expect(call[2]).toBe(10); // "actual" time
      expect(call[3]).toBe(10); // "base" time

      callback.mockReset();

      renderer.update(
        <React.unstable_ProfileRoot label="test" callback={callback}>
          <AdvanceTime />
        </React.unstable_ProfileRoot>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      [call] = callback.mock.calls;

      expect(call).toHaveLength(4);
      expect(call[0]).toBe('test');
      expect(call[1]).toBe('update');
      expect(call[2]).toBe(10); // "actual" time
      expect(call[3]).toBe(10); // "base" time
    });

    it('includes render times of nested ProfileRoots in their parent times', () => {
      const callback = jest.fn();

      ReactTestRenderer.create(
        <React.Fragment>
          <React.unstable_ProfileRoot label="parent" callback={callback}>
            <AdvanceTime byAmount={10}>
              <React.unstable_ProfileRoot label="child" callback={callback}>
                <AdvanceTime byAmount={20} />
              </React.unstable_ProfileRoot>
            </AdvanceTime>
          </React.unstable_ProfileRoot>
        </React.Fragment>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      // Callbacks bubble (reverse order).
      const [childCall, parentCall] = callback.mock.calls;
      expect(childCall[0]).toBe('child');
      expect(parentCall[0]).toBe('parent');

      // Parent times should include child times
      expect(childCall[2]).toBe(20); // "actual" time
      expect(childCall[3]).toBe(20); // "base" time
      expect(parentCall[2]).toBe(30); // "actual" time
      expect(parentCall[3]).toBe(30); // "base" time
    });

    it('tracks sibling ProfileRoots separately', () => {
      const callback = jest.fn();

      ReactTestRenderer.create(
        <React.Fragment>
          <React.unstable_ProfileRoot label="first" callback={callback}>
            <AdvanceTime byAmount={20} />
          </React.unstable_ProfileRoot>
          <React.unstable_ProfileRoot label="second" callback={callback}>
            <AdvanceTime byAmount={5} />
          </React.unstable_ProfileRoot>
        </React.Fragment>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      const [firstCall, secondCall] = callback.mock.calls;
      expect(firstCall[0]).toBe('first');
      expect(secondCall[0]).toBe('second');

      // Parent times should include child times
      expect(firstCall[2]).toBe(20); // "actual" time
      expect(firstCall[3]).toBe(20); // "base" time
      expect(secondCall[2]).toBe(5); // "actual" time
      expect(secondCall[3]).toBe(5); // "base" time
    });

    it('does not include time spent outside of profile root', () => {
      const callback = jest.fn();

      ReactTestRenderer.create(
        <React.Fragment>
          <AdvanceTime byAmount={20} />
          <React.unstable_ProfileRoot label="test" callback={callback}>
            <AdvanceTime byAmount={5} />
          </React.unstable_ProfileRoot>
          <AdvanceTime byAmount={20} />
        </React.Fragment>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      const [call] = callback.mock.calls;
      expect(call[0]).toBe('test');
      expect(call[2]).toBe(5); // "actual" time
      expect(call[3]).toBe(5); // "base" time
    });

    it('does not call callbacks after update for descendents of sCU false', () => {
      const callback = jest.fn();

      let instance;
      class Updater extends React.Component {
        state = {};
        render() {
          instance = this;
          return this.props.children;
        }
      }

      class Pure extends React.PureComponent {
        render() {
          return this.props.children;
        }
      }

      const renderer = ReactTestRenderer.create(
        <React.unstable_ProfileRoot label="outer" callback={callback}>
          <Updater>
            <React.unstable_ProfileRoot label="middle" callback={callback}>
              <Pure>
                <React.unstable_ProfileRoot label="inner" callback={callback}>
                  <div />
                </React.unstable_ProfileRoot>
              </Pure>
            </React.unstable_ProfileRoot>
          </Updater>
        </React.unstable_ProfileRoot>,
      );

      // All profile callbacks are called for initial render
      expect(callback).toHaveBeenCalledTimes(3);

      callback.mockReset();

      renderer.unstable_flushSync(() => {
        instance.setState({
          count: 1,
        });
      });

      // Only call profile updates for paths that have re-rendered
      // Since "inner" is beneath a pure compoent, it isn't called
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('middle');
      expect(callback.mock.calls[1][0]).toBe('outer');
    });

    it('decreases "actual" time but not "base" time when sCU prevents an update', () => {
      const callback = jest.fn();

      const renderer = ReactTestRenderer.create(
        <React.unstable_ProfileRoot label="test" callback={callback}>
          <AdvanceTime>
            <AdvanceTime shouldComponentUpdate={false} />
          </AdvanceTime>
        </React.unstable_ProfileRoot>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      renderer.update(
        <React.unstable_ProfileRoot label="test" callback={callback}>
          <AdvanceTime>
            <AdvanceTime shouldComponentUpdate={false} />
          </AdvanceTime>
        </React.unstable_ProfileRoot>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      const [mountCall, updateCall] = callback.mock.calls;

      expect(mountCall[1]).toBe('mount');
      expect(mountCall[2]).toBe(20); // "actual" time
      expect(mountCall[3]).toBe(20); // "base" time

      expect(updateCall[1]).toBe('update');
      expect(updateCall[2]).toBe(10); // "actual" time
      expect(updateCall[3]).toBe(20); // "base" time
    });

    describe('handles interruptions', () => {
      it('should accumulate "actual" time after a scheduling interruptions', () => {
        const callback = jest.fn();

        const Yield = ({value}) => {
          advanceTimeBy(10);
          renderer.unstable_yield(value);
          return null;
        };

        // Render partially, but run out of time before completing.
        const renderer = ReactTestRenderer.create(
          <React.unstable_ProfileRoot label="test" callback={callback}>
            <Yield value="first" />
            <Yield value="second" />
          </React.unstable_ProfileRoot>,
          {unstable_isAsync: true},
        );

        // Simulate only enough time to render the first Yield
        renderer.unstable_flushThrough(['first']);

        expect(callback).toHaveBeenCalledTimes(0);

        // Resume render for remaining children.
        renderer.unstable_flushAll();

        // Verify that logged times include both durations above.
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][2]).toBe(20); // "actual" time
        expect(callback.mock.calls[0][3]).toBe(20); // "base" time
      });

      it('should not include time between frames', () => {
        const callback = jest.fn();

        const Yield = ({renderTime, value}) => {
          advanceTimeBy(renderTime);
          renderer.unstable_yield(value);
          return null;
        };

        const renderer = ReactTestRenderer.create(
          <React.unstable_ProfileRoot label="outer" callback={callback}>
            <Yield value="first" renderTime={5} />
            <Yield value="second" renderTime={10} />
            <React.unstable_ProfileRoot label="inner" callback={callback}>
              <Yield value="third" renderTime={20} />
            </React.unstable_ProfileRoot>
          </React.unstable_ProfileRoot>,
          {unstable_isAsync: true},
        );

        // Render partially, but don't finish.
        // This partial render should take 5ms of simulated time.
        renderer.unstable_flushThrough(['first']);

        expect(callback).toHaveBeenCalledTimes(0);

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(50);

        // Flush the remaninig work,
        // Which should take an additional 10ms of simulated time.
        renderer.unstable_flushAll();

        expect(callback).toHaveBeenCalledTimes(2);

        const [innerCall, outerCall] = callback.mock.calls;

        // Verify that the "actual" time includes all work times,
        // But not the time that elapsed between frames.
        expect(innerCall[0]).toBe('inner');
        expect(innerCall[2]).toBe(20); // "actual" time
        expect(innerCall[3]).toBe(20); // "base" time
        expect(outerCall[0]).toBe('outer');
        expect(outerCall[2]).toBe(35); // "actual" time
        expect(outerCall[3]).toBe(35); // "base" time
      });

      it('should accumulate "actual" time after a higher priority interruption', () => {
        const callback = jest.fn();

        const Yield = ({renderTime, value}) => {
          advanceTimeBy(renderTime);
          renderer.unstable_yield(value);
          return null;
        };

        const renderer = ReactTestRenderer.create(
          <React.unstable_ProfileRoot label="test" callback={callback}>
            <Yield value="first" renderTime={10} />
            <Yield value="second" renderTime={20} />
          </React.unstable_ProfileRoot>,
          {unstable_isAsync: true},
        );

        // Render partially, but don't finish.
        // This partial render should take 10ms of simulated time.
        renderer.unstable_flushThrough(['first']);

        expect(callback).toHaveBeenCalledTimes(0);

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(30);

        // Interrupt with higher priority work.
        // The interrupted work simulates an additional 5ms of time.
        renderer.unstable_flushSync(() => {
          renderer.update(
            <React.unstable_ProfileRoot label="test" callback={callback}>
              <Yield value="third" renderTime={5} />
            </React.unstable_ProfileRoot>,
          );
        });

        // Verify that the "actual" time includes both durations above,
        // And the "base" time includes only the final rendered tree times.
        expect(callback).toHaveBeenCalledTimes(1);
        // TODO (bvaughn) Enable this test once resuming is supported
        // expect(callback.mock.calls[0][2]).toBe(15); // "actual" time
        expect(callback.mock.calls[0][3]).toBe(5); // "base" time

        // Verify no more unexpected callbacks from low priority work
        renderer.unstable_flushAll();
        expect(callback).toHaveBeenCalledTimes(1);
      });

      [true, false].forEach(flagEnabled => {
        describe(`replayFailedUnitOfWorkWithInvokeGuardedCallback ${
          flagEnabled ? 'enabled' : 'disabled'
        }`, () => {
          beforeEach(() => {
            jest.resetModules();

            loadModules({
              replayFailedUnitOfWorkWithInvokeGuardedCallback: flagEnabled,
            });
          });

          it('should accumulate "actual" time after an ErrorBoundary re-render', () => {
            const callback = jest.fn();

            const ThrowsError = () => {
              advanceTimeBy(10);
              throw Error('expected error');
            };

            class ErrorBoundary extends React.Component {
              state = {error: null};
              componentDidCatch(error) {
                this.setState({error});
              }
              render() {
                advanceTimeBy(2);
                return this.state.error === null ? (
                  this.props.children
                ) : (
                  <AdvanceTime byAmount={20} />
                );
              }
            }

            ReactTestRenderer.create(
              <React.unstable_ProfileRoot label="test" callback={callback}>
                <ErrorBoundary>
                  <AdvanceTime byAmount={5} />
                  <ThrowsError />
                </ErrorBoundary>
              </React.unstable_ProfileRoot>,
            );

            expect(callback).toHaveBeenCalledTimes(2);

            // Callbacks bubble (reverse order).
            let [mountCall, updateCall] = callback.mock.calls;

            // The initial mount only includes the ErrorBoundary (which takes 2ms)
            // But it spends time rendering all of the failed subtree also.
            expect(mountCall[1]).toBe('mount');
            // "actual" time includes: 2 (ErrorBoundary) + 5 (AdvanceTime) + 10 (ThrowsError)
            // If replayFailedUnitOfWorkWithInvokeGuardedCallback is enbaled, ThrowsError is replayed.
            expect(mountCall[2]).toBe(flagEnabled ? 27 : 17);
            // "base" time includes: 2 (ErrorBoundary)
            expect(mountCall[3]).toBe(2);

            // The update includes the ErrorBoundary and its fallback child
            expect(updateCall[1]).toBe('update');
            // "actual" time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
            expect(updateCall[2]).toBe(22);
            // "base" time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
            expect(updateCall[3]).toBe(22);
          });
        });
      });
    });
  });
});
