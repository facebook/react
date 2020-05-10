/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let ReactCache;
let ReactTestRenderer;
let SchedulerTracing;
let AdvanceTime;
let AsyncText;
let Text;
let TextResource;
let resourcePromise;

function loadModules({
  deferPassiveEffectCleanupDuringUnmount = false,
  enableProfilerTimer = true,
  enableProfilerCommitHooks = true,
  enableSchedulerTracing = true,
  replayFailedUnitOfWorkWithInvokeGuardedCallback = false,
  useNoopRenderer = false,
} = {}) {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');

  ReactFeatureFlags.deferPassiveEffectCleanupDuringUnmount = deferPassiveEffectCleanupDuringUnmount;
  ReactFeatureFlags.runAllPassiveEffectDestroysBeforeCreates = deferPassiveEffectCleanupDuringUnmount;
  ReactFeatureFlags.enableProfilerTimer = enableProfilerTimer;
  ReactFeatureFlags.enableProfilerCommitHooks = enableProfilerCommitHooks;
  ReactFeatureFlags.enableSchedulerTracing = enableSchedulerTracing;
  ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = replayFailedUnitOfWorkWithInvokeGuardedCallback;

  React = require('react');
  Scheduler = require('scheduler');
  SchedulerTracing = require('scheduler/tracing');
  ReactCache = require('react-cache');

  if (useNoopRenderer) {
    ReactNoop = require('react-noop-renderer');
    ReactTestRenderer = null;
  } else {
    ReactNoop = null;
    ReactTestRenderer = require('react-test-renderer');
  }

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
      Scheduler.unstable_advanceTime(this.props.byAmount);
      return this.props.children || null;
    }
  };

  resourcePromise = null;

  TextResource = ReactCache.unstable_createResource(
    ([text, ms = 0]) => {
      resourcePromise = new Promise((resolve, reject) =>
        setTimeout(() => {
          Scheduler.unstable_yieldValue(`Promise resolved [${text}]`);
          resolve(text);
        }, ms),
      );
      return resourcePromise;
    },
    ([text, ms]) => text,
  );

  AsyncText = ({ms, text}) => {
    try {
      TextResource.read([text, ms]);
      Scheduler.unstable_yieldValue(`AsyncText [${text}]`);
      return text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.unstable_yieldValue(`Suspend [${text}]`);
      } else {
        Scheduler.unstable_yieldValue(`Error [${text}]`);
      }
      throw promise;
    }
  };

  Text = ({text}) => {
    Scheduler.unstable_yieldValue(`Text [${text}]`);
    return text;
  };
}

describe('Profiler', () => {
  describe('works in profiling and non-profiling bundles', () => {
    [true, false].forEach(enableSchedulerTracing => {
      [true, false].forEach(enableProfilerTimer => {
        describe(`enableSchedulerTracing:${
          enableSchedulerTracing ? 'enabled' : 'disabled'
        } enableProfilerTimer:${
          enableProfilerTimer ? 'enabled' : 'disabled'
        }`, () => {
          beforeEach(() => {
            jest.resetModules();

            loadModules({enableSchedulerTracing, enableProfilerTimer});
          });

          // This will throw in production too,
          // But the test is only interested in verifying the DEV error message.
          if (__DEV__ && enableProfilerTimer) {
            it('should warn if required params are missing', () => {
              expect(() => {
                ReactTestRenderer.create(<React.Profiler />);
              }).toErrorDev('Profiler must specify an "id" as a prop', {
                withoutStack: true,
              });
            });
          }

          it('should support an empty Profiler (with no children)', () => {
            // As root
            expect(
              ReactTestRenderer.create(
                <React.Profiler id="label" onRender={jest.fn()} />,
              ).toJSON(),
            ).toMatchSnapshot();

            // As non-root
            expect(
              ReactTestRenderer.create(
                <div>
                  <React.Profiler id="label" onRender={jest.fn()} />
                </div>,
              ).toJSON(),
            ).toMatchSnapshot();
          });

          it('should render children', () => {
            const FunctionComponent = ({label}) => <span>{label}</span>;
            const renderer = ReactTestRenderer.create(
              <div>
                <span>outside span</span>
                <React.Profiler id="label" onRender={jest.fn()}>
                  <span>inside span</span>
                  <FunctionComponent label="function component" />
                </React.Profiler>
              </div>,
            );
            expect(renderer.toJSON()).toMatchSnapshot();
          });

          it('should support nested Profilers', () => {
            const FunctionComponent = ({label}) => <div>{label}</div>;
            class ClassComponent extends React.Component {
              render() {
                return <block>{this.props.label}</block>;
              }
            }
            const renderer = ReactTestRenderer.create(
              <React.Profiler id="outer" onRender={jest.fn()}>
                <FunctionComponent label="outer function component" />
                <React.Profiler id="inner" onRender={jest.fn()}>
                  <ClassComponent label="inner class component" />
                  <span>inner span</span>
                </React.Profiler>
              </React.Profiler>,
            );
            expect(renderer.toJSON()).toMatchSnapshot();
          });
        });
      });
    });
  });

  [true, false].forEach(deferPassiveEffectCleanupDuringUnmount => {
    [true, false].forEach(enableSchedulerTracing => {
      describe(`onRender enableSchedulerTracing:${
        enableSchedulerTracing ? 'enabled' : 'disabled'
      } deferPassiveEffectCleanupDuringUnmount:${
        deferPassiveEffectCleanupDuringUnmount ? 'enabled' : 'disabled'
      }`, () => {
        beforeEach(() => {
          jest.resetModules();

          loadModules({
            deferPassiveEffectCleanupDuringUnmount,
            enableSchedulerTracing,
          });
        });

        it('should handle errors thrown', () => {
          const callback = jest.fn(id => {
            if (id === 'throw') {
              throw Error('expected');
            }
          });

          let didMount = false;
          class ClassComponent extends React.Component {
            componentDidMount() {
              didMount = true;
            }
            render() {
              return this.props.children;
            }
          }

          // Errors thrown from onRender should not break the commit phase,
          // Or prevent other lifecycles from being called.
          expect(() =>
            ReactTestRenderer.create(
              <ClassComponent>
                <React.Profiler id="do-not-throw" onRender={callback}>
                  <React.Profiler id="throw" onRender={callback}>
                    <div />
                  </React.Profiler>
                </React.Profiler>
              </ClassComponent>,
            ),
          ).toThrow('expected');
          expect(didMount).toBe(true);
          expect(callback).toHaveBeenCalledTimes(2);
        });

        it('is not invoked until the commit phase', () => {
          const callback = jest.fn();

          const Yield = ({value}) => {
            Scheduler.unstable_yieldValue(value);
            return null;
          };

          ReactTestRenderer.create(
            <React.Profiler id="test" onRender={callback}>
              <Yield value="first" />
              <Yield value="last" />
            </React.Profiler>,
            {
              unstable_isConcurrent: true,
            },
          );

          // Times are logged until a render is committed.
          expect(Scheduler).toFlushAndYieldThrough(['first']);
          expect(callback).toHaveBeenCalledTimes(0);
          expect(Scheduler).toFlushAndYield(['last']);
          expect(callback).toHaveBeenCalledTimes(1);
        });

        it('does not record times for components outside of Profiler tree', () => {
          // Mock the Scheduler module so we can track how many times the current
          // time is read
          jest.mock('scheduler', obj => {
            const ActualScheduler = require.requireActual(
              'scheduler/unstable_mock',
            );
            return {
              ...ActualScheduler,
              unstable_now: function mockUnstableNow() {
                ActualScheduler.unstable_yieldValue('read current time');
                return ActualScheduler.unstable_now();
              },
            };
          });

          jest.resetModules();

          loadModules({enableSchedulerTracing});

          // Clear yields in case the current time is read during initialization.
          Scheduler.unstable_clearYields();

          ReactTestRenderer.create(
            <div>
              <AdvanceTime />
              <AdvanceTime />
              <AdvanceTime />
              <AdvanceTime />
              <AdvanceTime />
            </div>,
          );

          // Should be called two times:
          // 1. To compute the update expiration time
          // 2. To record the commit time
          // No additional calls from ProfilerTimer are expected.
          expect(Scheduler).toHaveYielded(
            gate(flags =>
              flags.new
                ? [
                    // The new reconciler reads the current time in more places,
                    // to detect starvation. This is unrelated to the profiler,
                    // which happens to use the same Scheduler method that we
                    // mocked above. We should rewrite this test so that it's
                    // less fragile.
                    'read current time',
                    'read current time',
                    'read current time',
                    'read current time',
                  ]
                : ['read current time', 'read current time'],
            ),
          );

          // Restore original mock
          jest.mock('scheduler', () =>
            require.requireActual('scheduler/unstable_mock'),
          );
        });

        it('does not report work done on a sibling', () => {
          const callback = jest.fn();

          const DoesNotUpdate = React.memo(
            function DoesNotUpdateInner() {
              Scheduler.unstable_advanceTime(10);
              return null;
            },
            () => true,
          );

          let updateProfilerSibling;

          function ProfilerSibling() {
            const [count, setCount] = React.useState(0);
            updateProfilerSibling = () => setCount(count + 1);
            return null;
          }

          function App() {
            return (
              <React.Fragment>
                <React.Profiler id="test" onRender={callback}>
                  <DoesNotUpdate />
                </React.Profiler>
                <ProfilerSibling />
              </React.Fragment>
            );
          }

          const renderer = ReactTestRenderer.create(<App />);

          expect(callback).toHaveBeenCalledTimes(1);

          let call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 7 : 6);
          expect(call[0]).toBe('test');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(10); // actual time
          expect(call[3]).toBe(10); // base time
          expect(call[4]).toBe(0); // start time
          expect(call[5]).toBe(10); // commit time
          expect(call[6]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          callback.mockReset();

          Scheduler.unstable_advanceTime(20); // 10 -> 30

          // Updating a parent should report a re-render,
          // since React technically did a little bit of work between the Profiler and the bailed out subtree.
          renderer.update(<App />);

          expect(callback).toHaveBeenCalledTimes(1);

          call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 7 : 6);
          expect(call[0]).toBe('test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(0); // actual time
          expect(call[3]).toBe(10); // base time
          expect(call[4]).toBe(30); // start time
          expect(call[5]).toBe(30); // commit time
          expect(call[6]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          callback.mockReset();

          Scheduler.unstable_advanceTime(20); // 30 -> 50

          // Updating a sibling should not report a re-render.
          ReactTestRenderer.act(updateProfilerSibling);

          expect(callback).not.toHaveBeenCalled();
        });

        it('logs render times for both mount and update', () => {
          const callback = jest.fn();

          Scheduler.unstable_advanceTime(5); // 0 -> 5

          const renderer = ReactTestRenderer.create(
            <React.Profiler id="test" onRender={callback}>
              <AdvanceTime />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(1);

          let [call] = callback.mock.calls;

          expect(call).toHaveLength(enableSchedulerTracing ? 7 : 6);
          expect(call[0]).toBe('test');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(10); // actual time
          expect(call[3]).toBe(10); // base time
          expect(call[4]).toBe(5); // start time
          expect(call[5]).toBe(15); // commit time
          expect(call[6]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          callback.mockReset();

          Scheduler.unstable_advanceTime(20); // 15 -> 35

          renderer.update(
            <React.Profiler id="test" onRender={callback}>
              <AdvanceTime />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(1);

          [call] = callback.mock.calls;

          expect(call).toHaveLength(enableSchedulerTracing ? 7 : 6);
          expect(call[0]).toBe('test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(10); // actual time
          expect(call[3]).toBe(10); // base time
          expect(call[4]).toBe(35); // start time
          expect(call[5]).toBe(45); // commit time
          expect(call[6]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          callback.mockReset();

          Scheduler.unstable_advanceTime(20); // 45 -> 65

          renderer.update(
            <React.Profiler id="test" onRender={callback}>
              <AdvanceTime byAmount={4} />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(1);

          [call] = callback.mock.calls;

          expect(call).toHaveLength(enableSchedulerTracing ? 7 : 6);
          expect(call[0]).toBe('test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(4); // actual time
          expect(call[3]).toBe(4); // base time
          expect(call[4]).toBe(65); // start time
          expect(call[5]).toBe(69); // commit time
          expect(call[6]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('includes render times of nested Profilers in their parent times', () => {
          const callback = jest.fn();

          Scheduler.unstable_advanceTime(5); // 0 -> 5

          ReactTestRenderer.create(
            <React.Fragment>
              <React.Profiler id="parent" onRender={callback}>
                <AdvanceTime byAmount={10}>
                  <React.Profiler id="child" onRender={callback}>
                    <AdvanceTime byAmount={20} />
                  </React.Profiler>
                </AdvanceTime>
              </React.Profiler>
            </React.Fragment>,
          );

          expect(callback).toHaveBeenCalledTimes(2);

          // Callbacks bubble (reverse order).
          const [childCall, parentCall] = callback.mock.calls;
          expect(childCall[0]).toBe('child');
          expect(parentCall[0]).toBe('parent');

          // Parent times should include child times
          expect(childCall[2]).toBe(20); // actual time
          expect(childCall[3]).toBe(20); // base time
          expect(childCall[4]).toBe(15); // start time
          expect(childCall[5]).toBe(35); // commit time
          expect(parentCall[2]).toBe(30); // actual time
          expect(parentCall[3]).toBe(30); // base time
          expect(parentCall[4]).toBe(5); // start time
          expect(parentCall[5]).toBe(35); // commit time
        });

        it('traces sibling Profilers separately', () => {
          const callback = jest.fn();

          Scheduler.unstable_advanceTime(5); // 0 -> 5

          ReactTestRenderer.create(
            <React.Fragment>
              <React.Profiler id="first" onRender={callback}>
                <AdvanceTime byAmount={20} />
              </React.Profiler>
              <React.Profiler id="second" onRender={callback}>
                <AdvanceTime byAmount={5} />
              </React.Profiler>
            </React.Fragment>,
          );

          expect(callback).toHaveBeenCalledTimes(2);

          const [firstCall, secondCall] = callback.mock.calls;
          expect(firstCall[0]).toBe('first');
          expect(secondCall[0]).toBe('second');

          // Parent times should include child times
          expect(firstCall[2]).toBe(20); // actual time
          expect(firstCall[3]).toBe(20); // base time
          expect(firstCall[4]).toBe(5); // start time
          expect(firstCall[5]).toBe(30); // commit time
          expect(secondCall[2]).toBe(5); // actual time
          expect(secondCall[3]).toBe(5); // base time
          expect(secondCall[4]).toBe(25); // start time
          expect(secondCall[5]).toBe(30); // commit time
        });

        it('does not include time spent outside of profile root', () => {
          const callback = jest.fn();

          Scheduler.unstable_advanceTime(5); // 0 -> 5

          ReactTestRenderer.create(
            <React.Fragment>
              <AdvanceTime byAmount={20} />
              <React.Profiler id="test" onRender={callback}>
                <AdvanceTime byAmount={5} />
              </React.Profiler>
              <AdvanceTime byAmount={20} />
            </React.Fragment>,
          );

          expect(callback).toHaveBeenCalledTimes(1);

          const [call] = callback.mock.calls;
          expect(call[0]).toBe('test');
          expect(call[2]).toBe(5); // actual time
          expect(call[3]).toBe(5); // base time
          expect(call[4]).toBe(25); // start time
          expect(call[5]).toBe(50); // commit time
        });

        it('is not called when blocked by sCU false', () => {
          const callback = jest.fn();

          let instance;
          class Updater extends React.Component {
            state = {};
            render() {
              instance = this;
              return this.props.children;
            }
          }

          const renderer = ReactTestRenderer.create(
            <React.Profiler id="outer" onRender={callback}>
              <Updater>
                <React.Profiler id="inner" onRender={callback}>
                  <div />
                </React.Profiler>
              </Updater>
            </React.Profiler>,
          );

          // All profile callbacks are called for initial render
          expect(callback).toHaveBeenCalledTimes(2);

          callback.mockReset();

          renderer.unstable_flushSync(() => {
            instance.setState({
              count: 1,
            });
          });

          // Only call onRender for paths that have re-rendered.
          // Since the Updater's props didn't change,
          // React does not re-render its children.
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[0][0]).toBe('outer');
        });

        it('decreases actual time but not base time when sCU prevents an update', () => {
          const callback = jest.fn();

          Scheduler.unstable_advanceTime(5); // 0 -> 5

          const renderer = ReactTestRenderer.create(
            <React.Profiler id="test" onRender={callback}>
              <AdvanceTime byAmount={10}>
                <AdvanceTime byAmount={13} shouldComponentUpdate={false} />
              </AdvanceTime>
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(1);

          Scheduler.unstable_advanceTime(30); // 28 -> 58

          renderer.update(
            <React.Profiler id="test" onRender={callback}>
              <AdvanceTime byAmount={4}>
                <AdvanceTime byAmount={7} shouldComponentUpdate={false} />
              </AdvanceTime>
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(2);

          const [mountCall, updateCall] = callback.mock.calls;

          expect(mountCall[1]).toBe('mount');
          expect(mountCall[2]).toBe(23); // actual time
          expect(mountCall[3]).toBe(23); // base time
          expect(mountCall[4]).toBe(5); // start time
          expect(mountCall[5]).toBe(28); // commit time

          expect(updateCall[1]).toBe('update');
          expect(updateCall[2]).toBe(4); // actual time
          expect(updateCall[3]).toBe(17); // base time
          expect(updateCall[4]).toBe(58); // start time
          expect(updateCall[5]).toBe(62); // commit time
        });

        it('includes time spent in render phase lifecycles', () => {
          class WithLifecycles extends React.Component {
            state = {};
            static getDerivedStateFromProps() {
              Scheduler.unstable_advanceTime(3);
              return null;
            }
            shouldComponentUpdate() {
              Scheduler.unstable_advanceTime(7);
              return true;
            }
            render() {
              Scheduler.unstable_advanceTime(5);
              return null;
            }
          }

          const callback = jest.fn();

          Scheduler.unstable_advanceTime(5); // 0 -> 5

          const renderer = ReactTestRenderer.create(
            <React.Profiler id="test" onRender={callback}>
              <WithLifecycles />
            </React.Profiler>,
          );

          Scheduler.unstable_advanceTime(15); // 13 -> 28

          renderer.update(
            <React.Profiler id="test" onRender={callback}>
              <WithLifecycles />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(2);

          const [mountCall, updateCall] = callback.mock.calls;

          expect(mountCall[1]).toBe('mount');
          expect(mountCall[2]).toBe(8); // actual time
          expect(mountCall[3]).toBe(8); // base time
          expect(mountCall[4]).toBe(5); // start time
          expect(mountCall[5]).toBe(13); // commit time

          expect(updateCall[1]).toBe('update');
          expect(updateCall[2]).toBe(15); // actual time
          expect(updateCall[3]).toBe(15); // base time
          expect(updateCall[4]).toBe(28); // start time
          expect(updateCall[5]).toBe(43); // commit time
        });

        describe('with regard to interruptions', () => {
          it('should accumulate actual time after a scheduling interruptions', () => {
            const callback = jest.fn();

            const Yield = ({renderTime}) => {
              Scheduler.unstable_advanceTime(renderTime);
              Scheduler.unstable_yieldValue('Yield:' + renderTime);
              return null;
            };

            Scheduler.unstable_advanceTime(5); // 0 -> 5

            // Render partially, but run out of time before completing.
            ReactTestRenderer.create(
              <React.Profiler id="test" onRender={callback}>
                <Yield renderTime={2} />
                <Yield renderTime={3} />
              </React.Profiler>,
              {unstable_isConcurrent: true},
            );
            expect(Scheduler).toFlushAndYieldThrough(['Yield:2']);
            expect(callback).toHaveBeenCalledTimes(0);

            // Resume render for remaining children.
            expect(Scheduler).toFlushAndYield(['Yield:3']);

            // Verify that logged times include both durations above.
            expect(callback).toHaveBeenCalledTimes(1);
            const [call] = callback.mock.calls;
            expect(call[2]).toBe(5); // actual time
            expect(call[3]).toBe(5); // base time
            expect(call[4]).toBe(5); // start time
            expect(call[5]).toBe(10); // commit time
          });

          it('should not include time between frames', () => {
            const callback = jest.fn();

            const Yield = ({renderTime}) => {
              Scheduler.unstable_advanceTime(renderTime);
              Scheduler.unstable_yieldValue('Yield:' + renderTime);
              return null;
            };

            Scheduler.unstable_advanceTime(5); // 0 -> 5

            // Render partially, but don't finish.
            // This partial render should take 5ms of simulated time.
            ReactTestRenderer.create(
              <React.Profiler id="outer" onRender={callback}>
                <Yield renderTime={5} />
                <Yield renderTime={10} />
                <React.Profiler id="inner" onRender={callback}>
                  <Yield renderTime={17} />
                </React.Profiler>
              </React.Profiler>,
              {unstable_isConcurrent: true},
            );
            expect(Scheduler).toFlushAndYieldThrough(['Yield:5']);
            expect(callback).toHaveBeenCalledTimes(0);

            // Simulate time moving forward while frame is paused.
            Scheduler.unstable_advanceTime(50); // 10 -> 60

            // Flush the remaining work,
            // Which should take an additional 10ms of simulated time.
            expect(Scheduler).toFlushAndYield(['Yield:10', 'Yield:17']);
            expect(callback).toHaveBeenCalledTimes(2);

            const [innerCall, outerCall] = callback.mock.calls;

            // Verify that the actual time includes all work times,
            // But not the time that elapsed between frames.
            expect(innerCall[0]).toBe('inner');
            expect(innerCall[2]).toBe(17); // actual time
            expect(innerCall[3]).toBe(17); // base time
            expect(innerCall[4]).toBe(70); // start time
            expect(innerCall[5]).toBe(87); // commit time
            expect(outerCall[0]).toBe('outer');
            expect(outerCall[2]).toBe(32); // actual time
            expect(outerCall[3]).toBe(32); // base time
            expect(outerCall[4]).toBe(5); // start time
            expect(outerCall[5]).toBe(87); // commit time
          });

          it('should report the expected times when a high-pri update replaces a mount in-progress', () => {
            const callback = jest.fn();

            const Yield = ({renderTime}) => {
              Scheduler.unstable_advanceTime(renderTime);
              Scheduler.unstable_yieldValue('Yield:' + renderTime);
              return null;
            };

            Scheduler.unstable_advanceTime(5); // 0 -> 5

            // Render a partially update, but don't finish.
            // This partial render should take 10ms of simulated time.
            const renderer = ReactTestRenderer.create(
              <React.Profiler id="test" onRender={callback}>
                <Yield renderTime={10} />
                <Yield renderTime={20} />
              </React.Profiler>,
              {unstable_isConcurrent: true},
            );
            expect(Scheduler).toFlushAndYieldThrough(['Yield:10']);
            expect(callback).toHaveBeenCalledTimes(0);

            // Simulate time moving forward while frame is paused.
            Scheduler.unstable_advanceTime(100); // 15 -> 115

            // Interrupt with higher priority work.
            // The interrupted work simulates an additional 5ms of time.
            renderer.unstable_flushSync(() => {
              renderer.update(
                <React.Profiler id="test" onRender={callback}>
                  <Yield renderTime={5} />
                </React.Profiler>,
              );
            });
            expect(Scheduler).toHaveYielded(['Yield:5']);

            // The initial work was thrown away in this case,
            // So the actual and base times should only include the final rendered tree times.
            expect(callback).toHaveBeenCalledTimes(1);
            const call = callback.mock.calls[0];
            expect(call[2]).toBe(5); // actual time
            expect(call[3]).toBe(5); // base time
            expect(call[4]).toBe(115); // start time
            expect(call[5]).toBe(120); // commit time

            callback.mockReset();

            // Verify no more unexpected callbacks from low priority work
            expect(Scheduler).toFlushWithoutYielding();
            expect(callback).toHaveBeenCalledTimes(0);
          });

          it('should report the expected times when a high-priority update replaces a low-priority update', () => {
            const callback = jest.fn();

            const Yield = ({renderTime}) => {
              Scheduler.unstable_advanceTime(renderTime);
              Scheduler.unstable_yieldValue('Yield:' + renderTime);
              return null;
            };

            Scheduler.unstable_advanceTime(5); // 0 -> 5

            const renderer = ReactTestRenderer.create(
              <React.Profiler id="test" onRender={callback}>
                <Yield renderTime={6} />
                <Yield renderTime={15} />
              </React.Profiler>,
              {unstable_isConcurrent: true},
            );

            // Render everything initially.
            // This should take 21 seconds of actual and base time.
            expect(Scheduler).toFlushAndYield(['Yield:6', 'Yield:15']);
            expect(callback).toHaveBeenCalledTimes(1);
            let call = callback.mock.calls[0];
            expect(call[2]).toBe(21); // actual time
            expect(call[3]).toBe(21); // base time
            expect(call[4]).toBe(5); // start time
            expect(call[5]).toBe(26); // commit time

            callback.mockReset();

            Scheduler.unstable_advanceTime(30); // 26 -> 56

            // Render a partially update, but don't finish.
            // This partial render should take 3ms of simulated time.
            renderer.update(
              <React.Profiler id="test" onRender={callback}>
                <Yield renderTime={3} />
                <Yield renderTime={5} />
                <Yield renderTime={9} />
              </React.Profiler>,
            );
            expect(Scheduler).toFlushAndYieldThrough(['Yield:3']);
            expect(callback).toHaveBeenCalledTimes(0);

            // Simulate time moving forward while frame is paused.
            Scheduler.unstable_advanceTime(100); // 59 -> 159

            // Render another 5ms of simulated time.
            expect(Scheduler).toFlushAndYieldThrough(['Yield:5']);
            expect(callback).toHaveBeenCalledTimes(0);

            // Simulate time moving forward while frame is paused.
            Scheduler.unstable_advanceTime(100); // 164 -> 264

            // Interrupt with higher priority work.
            // The interrupted work simulates an additional 11ms of time.
            renderer.unstable_flushSync(() => {
              renderer.update(
                <React.Profiler id="test" onRender={callback}>
                  <Yield renderTime={11} />
                </React.Profiler>,
              );
            });
            expect(Scheduler).toHaveYielded(['Yield:11']);

            // The actual time should include only the most recent render,
            // Because this lets us avoid a lot of commit phase reset complexity.
            // The base time includes only the final rendered tree times.
            expect(callback).toHaveBeenCalledTimes(1);
            call = callback.mock.calls[0];
            expect(call[2]).toBe(11); // actual time
            expect(call[3]).toBe(11); // base time
            expect(call[4]).toBe(264); // start time
            expect(call[5]).toBe(275); // commit time

            // Verify no more unexpected callbacks from low priority work
            expect(Scheduler).toFlushAndYield([]);
            expect(callback).toHaveBeenCalledTimes(1);
          });

          it('should report the expected times when a high-priority update interrupts a low-priority update', () => {
            const callback = jest.fn();

            const Yield = ({renderTime}) => {
              Scheduler.unstable_advanceTime(renderTime);
              Scheduler.unstable_yieldValue('Yield:' + renderTime);
              return null;
            };

            let first;
            class FirstComponent extends React.Component {
              state = {renderTime: 1};
              render() {
                first = this;
                Scheduler.unstable_advanceTime(this.state.renderTime);
                Scheduler.unstable_yieldValue(
                  'FirstComponent:' + this.state.renderTime,
                );
                return <Yield renderTime={4} />;
              }
            }
            let second;
            class SecondComponent extends React.Component {
              state = {renderTime: 2};
              render() {
                second = this;
                Scheduler.unstable_advanceTime(this.state.renderTime);
                Scheduler.unstable_yieldValue(
                  'SecondComponent:' + this.state.renderTime,
                );
                return <Yield renderTime={7} />;
              }
            }

            Scheduler.unstable_advanceTime(5); // 0 -> 5

            const renderer = ReactTestRenderer.create(
              <React.Profiler id="test" onRender={callback}>
                <FirstComponent />
                <SecondComponent />
              </React.Profiler>,
              {unstable_isConcurrent: true},
            );

            // Render everything initially.
            // This simulates a total of 14ms of actual render time.
            // The base render time is also 14ms for the initial render.
            expect(Scheduler).toFlushAndYield([
              'FirstComponent:1',
              'Yield:4',
              'SecondComponent:2',
              'Yield:7',
            ]);
            expect(callback).toHaveBeenCalledTimes(1);
            let call = callback.mock.calls[0];
            expect(call[2]).toBe(14); // actual time
            expect(call[3]).toBe(14); // base time
            expect(call[4]).toBe(5); // start time
            expect(call[5]).toBe(19); // commit time

            callback.mockClear();

            Scheduler.unstable_advanceTime(100); // 19 -> 119

            // Render a partially update, but don't finish.
            // This partial render will take 10ms of actual render time.
            first.setState({renderTime: 10});
            expect(Scheduler).toFlushAndYieldThrough(['FirstComponent:10']);
            expect(callback).toHaveBeenCalledTimes(0);

            // Simulate time moving forward while frame is paused.
            Scheduler.unstable_advanceTime(100); // 129 -> 229

            // Interrupt with higher priority work.
            // This simulates a total of 37ms of actual render time.
            renderer.unstable_flushSync(() =>
              second.setState({renderTime: 30}),
            );
            expect(Scheduler).toHaveYielded(['SecondComponent:30', 'Yield:7']);

            // The actual time should include only the most recent render (37ms),
            // Because this greatly simplifies the commit phase logic.
            // The base time should include the more recent times for the SecondComponent subtree,
            // As well as the original times for the FirstComponent subtree.
            expect(callback).toHaveBeenCalledTimes(1);
            call = callback.mock.calls[0];
            expect(call[2]).toBe(37); // actual time
            expect(call[3]).toBe(42); // base time
            expect(call[4]).toBe(229); // start time
            expect(call[5]).toBe(266); // commit time

            callback.mockClear();

            // Simulate time moving forward while frame is paused.
            Scheduler.unstable_advanceTime(100); // 266 -> 366

            // Resume the original low priority update, with rebased state.
            // This simulates a total of 14ms of actual render time,
            // And does not include the original (interrupted) 10ms.
            // The tree contains 42ms of base render time at this point,
            // Reflecting the most recent (longer) render durations.
            // TODO: This actual time should decrease by 10ms once the scheduler supports resuming.
            expect(Scheduler).toFlushAndYield(['FirstComponent:10', 'Yield:4']);
            expect(callback).toHaveBeenCalledTimes(1);
            call = callback.mock.calls[0];
            expect(call[2]).toBe(14); // actual time
            expect(call[3]).toBe(51); // base time
            expect(call[4]).toBe(366); // start time
            expect(call[5]).toBe(380); // commit time
          });

          [true, false].forEach(
            replayFailedUnitOfWorkWithInvokeGuardedCallback => {
              describe(`replayFailedUnitOfWorkWithInvokeGuardedCallback ${
                replayFailedUnitOfWorkWithInvokeGuardedCallback
                  ? 'enabled'
                  : 'disabled'
              }`, () => {
                beforeEach(() => {
                  jest.resetModules();

                  loadModules({
                    replayFailedUnitOfWorkWithInvokeGuardedCallback,
                  });
                });

                it('should accumulate actual time after an error handled by componentDidCatch()', () => {
                  const callback = jest.fn();

                  const ThrowsError = ({unused}) => {
                    Scheduler.unstable_advanceTime(3);
                    throw Error('expected error');
                  };

                  class ErrorBoundary extends React.Component {
                    state = {error: null};
                    componentDidCatch(error) {
                      this.setState({error});
                    }
                    render() {
                      Scheduler.unstable_advanceTime(2);
                      return this.state.error === null ? (
                        this.props.children
                      ) : (
                        <AdvanceTime byAmount={20} />
                      );
                    }
                  }

                  Scheduler.unstable_advanceTime(5); // 0 -> 5

                  ReactTestRenderer.create(
                    <React.Profiler id="test" onRender={callback}>
                      <ErrorBoundary>
                        <AdvanceTime byAmount={9} />
                        <ThrowsError />
                      </ErrorBoundary>
                    </React.Profiler>,
                  );

                  expect(callback).toHaveBeenCalledTimes(2);

                  // Callbacks bubble (reverse order).
                  const [mountCall, updateCall] = callback.mock.calls;

                  // The initial mount only includes the ErrorBoundary (which takes 2)
                  // But it spends time rendering all of the failed subtree also.
                  expect(mountCall[1]).toBe('mount');
                  // actual time includes: 2 (ErrorBoundary) + 9 (AdvanceTime) + 3 (ThrowsError)
                  // We don't count the time spent in replaying the failed unit of work (ThrowsError)
                  expect(mountCall[2]).toBe(14);
                  // base time includes: 2 (ErrorBoundary)
                  // Since the tree is empty for the initial commit
                  expect(mountCall[3]).toBe(2);
                  // start time
                  expect(mountCall[4]).toBe(5);
                  // commit time: 5 initially + 14 of work
                  // Add an additional 3 (ThrowsError) if we replayed the failed work
                  expect(mountCall[5]).toBe(
                    __DEV__ && replayFailedUnitOfWorkWithInvokeGuardedCallback
                      ? 22
                      : 19,
                  );

                  // The update includes the ErrorBoundary and its fallback child
                  expect(updateCall[1]).toBe('update');
                  // actual time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
                  expect(updateCall[2]).toBe(22);
                  // base time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
                  expect(updateCall[3]).toBe(22);
                  // start time
                  expect(updateCall[4]).toBe(
                    __DEV__ && replayFailedUnitOfWorkWithInvokeGuardedCallback
                      ? 22
                      : 19,
                  );
                  // commit time: 19 (startTime) + 2 (ErrorBoundary) + 20 (AdvanceTime)
                  // Add an additional 3 (ThrowsError) if we replayed the failed work
                  expect(updateCall[5]).toBe(
                    __DEV__ && replayFailedUnitOfWorkWithInvokeGuardedCallback
                      ? 44
                      : 41,
                  );
                });

                it('should accumulate actual time after an error handled by getDerivedStateFromError()', () => {
                  const callback = jest.fn();

                  const ThrowsError = ({unused}) => {
                    Scheduler.unstable_advanceTime(10);
                    throw Error('expected error');
                  };

                  class ErrorBoundary extends React.Component {
                    state = {error: null};
                    static getDerivedStateFromError(error) {
                      return {error};
                    }
                    render() {
                      Scheduler.unstable_advanceTime(2);
                      return this.state.error === null ? (
                        this.props.children
                      ) : (
                        <AdvanceTime byAmount={20} />
                      );
                    }
                  }

                  Scheduler.unstable_advanceTime(5); // 0 -> 5

                  ReactTestRenderer.create(
                    <React.Profiler id="test" onRender={callback}>
                      <ErrorBoundary>
                        <AdvanceTime byAmount={5} />
                        <ThrowsError />
                      </ErrorBoundary>
                    </React.Profiler>,
                  );

                  expect(callback).toHaveBeenCalledTimes(1);

                  // Callbacks bubble (reverse order).
                  const [mountCall] = callback.mock.calls;

                  // The initial mount includes the ErrorBoundary's error state,
                  // But it also spends actual time rendering UI that fails and isn't included.
                  expect(mountCall[1]).toBe('mount');
                  // actual time includes: 2 (ErrorBoundary) + 5 (AdvanceTime) + 10 (ThrowsError)
                  // Then the re-render: 2 (ErrorBoundary) + 20 (AdvanceTime)
                  // We don't count the time spent in replaying the failed unit of work (ThrowsError)
                  expect(mountCall[2]).toBe(39);
                  // base time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
                  expect(mountCall[3]).toBe(22);
                  // start time
                  expect(mountCall[4]).toBe(5);
                  // commit time
                  expect(mountCall[5]).toBe(
                    __DEV__ && replayFailedUnitOfWorkWithInvokeGuardedCallback
                      ? 54
                      : 44,
                  );
                });

                it('should reset the fiber stack correct after a "complete" phase error', () => {
                  jest.resetModules();

                  loadModules({
                    useNoopRenderer: true,
                    replayFailedUnitOfWorkWithInvokeGuardedCallback,
                  });

                  // Simulate a renderer error during the "complete" phase.
                  // This mimics behavior like React Native's View/Text nesting validation.
                  ReactNoop.render(
                    <React.Profiler id="profiler" onRender={jest.fn()}>
                      <errorInCompletePhase>hi</errorInCompletePhase>
                    </React.Profiler>,
                  );
                  expect(Scheduler).toFlushAndThrow('Error in host config.');

                  // A similar case we've seen caused by an invariant in ReactDOM.
                  // It didn't reproduce without a host component inside.
                  ReactNoop.render(
                    <React.Profiler id="profiler" onRender={jest.fn()}>
                      <errorInCompletePhase>
                        <span>hi</span>
                      </errorInCompletePhase>
                    </React.Profiler>,
                  );
                  expect(Scheduler).toFlushAndThrow('Error in host config.');

                  // So long as the profiler timer's fiber stack is reset correctly,
                  // Subsequent renders should not error.
                  ReactNoop.render(
                    <React.Profiler id="profiler" onRender={jest.fn()}>
                      <span>hi</span>
                    </React.Profiler>,
                  );
                  expect(Scheduler).toFlushWithoutYielding();
                });
              });
            },
          );
        });

        it('reflects the most recently rendered id value', () => {
          const callback = jest.fn();

          Scheduler.unstable_advanceTime(5); // 0 -> 5

          const renderer = ReactTestRenderer.create(
            <React.Profiler id="one" onRender={callback}>
              <AdvanceTime byAmount={2} />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(1);

          Scheduler.unstable_advanceTime(20); // 7 -> 27

          renderer.update(
            <React.Profiler id="two" onRender={callback}>
              <AdvanceTime byAmount={1} />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(2);

          const [mountCall, updateCall] = callback.mock.calls;

          expect(mountCall[0]).toBe('one');
          expect(mountCall[1]).toBe('mount');
          expect(mountCall[2]).toBe(2); // actual time
          expect(mountCall[3]).toBe(2); // base time
          expect(mountCall[4]).toBe(5); // start time

          expect(updateCall[0]).toBe('two');
          expect(updateCall[1]).toBe('update');
          expect(updateCall[2]).toBe(1); // actual time
          expect(updateCall[3]).toBe(1); // base time
          expect(updateCall[4]).toBe(27); // start time
        });

        it('should not be called until after mutations', () => {
          let classComponentMounted = false;
          const callback = jest.fn(
            (
              id,
              phase,
              actualDuration,
              baseDuration,
              startTime,
              commitTime,
            ) => {
              // Don't call this hook until after mutations
              expect(classComponentMounted).toBe(true);
              // But the commit time should reflect pre-mutation
              expect(commitTime).toBe(2);
            },
          );

          class ClassComponent extends React.Component {
            componentDidMount() {
              Scheduler.unstable_advanceTime(5);
              classComponentMounted = true;
            }
            render() {
              Scheduler.unstable_advanceTime(2);
              return null;
            }
          }

          ReactTestRenderer.create(
            <React.Profiler id="test" onRender={callback}>
              <ClassComponent />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(1);
        });
      });

      describe(`onCommit enableSchedulerTracing:${
        enableSchedulerTracing ? 'enabled' : 'disabled'
      } deferPassiveEffectCleanupDuringUnmount:${
        deferPassiveEffectCleanupDuringUnmount ? 'enabled' : 'disabled'
      }`, () => {
        beforeEach(() => {
          jest.resetModules();

          loadModules({
            deferPassiveEffectCleanupDuringUnmount,
            enableSchedulerTracing,
          });
        });

        it('should report time spent in layout effects and commit lifecycles', () => {
          const callback = jest.fn();

          const ComponetWithEffects = () => {
            React.useLayoutEffect(() => {
              Scheduler.unstable_advanceTime(10);
              return () => {
                Scheduler.unstable_advanceTime(100);
              };
            }, []);
            React.useLayoutEffect(() => {
              Scheduler.unstable_advanceTime(1000);
              return () => {
                Scheduler.unstable_advanceTime(10000);
              };
            });
            React.useEffect(() => {
              // This passive effect is here to verify that its time isn't reported.
              Scheduler.unstable_advanceTime(5);
              return () => {
                Scheduler.unstable_advanceTime(7);
              };
            });
            return null;
          };

          class ComponentWithCommitHooks extends React.Component {
            componentDidMount() {
              Scheduler.unstable_advanceTime(100000);
            }
            componentDidUpdate() {
              Scheduler.unstable_advanceTime(1000000);
            }
            render() {
              return null;
            }
          }

          Scheduler.unstable_advanceTime(1);

          const renderer = ReactTestRenderer.create(
            <React.Profiler id="mount-test" onCommit={callback}>
              <ComponetWithEffects />
              <ComponentWithCommitHooks />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(1);

          let call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('mount-test');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(101010); // durations
          expect(call[3]).toBe(1); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          Scheduler.unstable_advanceTime(1);

          renderer.update(
            <React.Profiler id="update-test" onCommit={callback}>
              <ComponetWithEffects />
              <ComponentWithCommitHooks />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(2);

          call = callback.mock.calls[1];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('update-test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(1011000); // durations
          expect(call[3]).toBe(101017); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          Scheduler.unstable_advanceTime(1);

          renderer.update(
            <React.Profiler id="unmount-test" onCommit={callback} />,
          );

          expect(callback).toHaveBeenCalledTimes(3);

          call = callback.mock.calls[2];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('unmount-test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(10100); // durations
          expect(call[3]).toBe(1112030); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should report time spent in layout effects and commit lifecycles with cascading renders', () => {
          const callback = jest.fn();

          const ComponetWithEffects = ({shouldCascade}) => {
            const [didCascade, setDidCascade] = React.useState(false);
            React.useLayoutEffect(() => {
              if (shouldCascade && !didCascade) {
                setDidCascade(true);
              }
              Scheduler.unstable_advanceTime(didCascade ? 30 : 10);
              return () => {
                Scheduler.unstable_advanceTime(100);
              };
            }, [didCascade, shouldCascade]);
            return null;
          };

          class ComponentWithCommitHooks extends React.Component {
            state = {
              didCascade: false,
            };
            componentDidMount() {
              Scheduler.unstable_advanceTime(1000);
            }
            componentDidUpdate() {
              Scheduler.unstable_advanceTime(10000);
              if (this.props.shouldCascade && !this.state.didCascade) {
                this.setState({didCascade: true});
              }
            }
            render() {
              return null;
            }
          }

          Scheduler.unstable_advanceTime(1);

          const renderer = ReactTestRenderer.create(
            <React.Profiler id="mount-test" onCommit={callback}>
              <ComponetWithEffects shouldCascade={true} />
              <ComponentWithCommitHooks />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(2);

          let call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('mount-test');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(1010); // durations
          expect(call[3]).toBe(1); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          call = callback.mock.calls[1];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('mount-test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(130); // durations
          expect(call[3]).toBe(1011); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          Scheduler.unstable_advanceTime(1);

          renderer.update(
            <React.Profiler id="update-test" onCommit={callback}>
              <ComponetWithEffects />
              <ComponentWithCommitHooks shouldCascade={true} />
            </React.Profiler>,
          );

          expect(callback).toHaveBeenCalledTimes(4);

          call = callback.mock.calls[2];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('update-test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(10130); // durations
          expect(call[3]).toBe(1142); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          call = callback.mock.calls[3];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('update-test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(10000); // durations
          expect(call[3]).toBe(11272); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should bubble time spent in layout effects to higher profilers', () => {
          const callback = jest.fn();

          const ComponetWithEffects = ({
            cleanupDuration,
            duration,
            setCountRef,
          }) => {
            const setCount = React.useState(0)[1];
            if (setCountRef != null) {
              setCountRef.current = setCount;
            }
            React.useLayoutEffect(() => {
              Scheduler.unstable_advanceTime(duration);
              return () => {
                Scheduler.unstable_advanceTime(cleanupDuration);
              };
            });
            Scheduler.unstable_advanceTime(1);
            return null;
          };

          const setCountRef = React.createRef(null);

          let renderer = null;
          ReactTestRenderer.act(() => {
            renderer = ReactTestRenderer.create(
              <React.Profiler id="root-mount" onCommit={callback}>
                <React.Profiler id="a">
                  <ComponetWithEffects
                    duration={10}
                    cleanupDuration={100}
                    setCountRef={setCountRef}
                  />
                </React.Profiler>
                <React.Profiler id="b">
                  <ComponetWithEffects
                    duration={1000}
                    cleanupDuration={10000}
                  />
                </React.Profiler>
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(1);

          let call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root-mount');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(1010); // durations
          expect(call[3]).toBe(2); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          ReactTestRenderer.act(() => setCountRef.current(count => count + 1));

          expect(callback).toHaveBeenCalledTimes(2);

          call = callback.mock.calls[1];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root-mount');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(110); // durations
          expect(call[3]).toBe(1013); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          ReactTestRenderer.act(() => {
            renderer.update(
              <React.Profiler id="root-update" onCommit={callback}>
                <React.Profiler id="b">
                  <ComponetWithEffects
                    duration={1000}
                    cleanupDuration={10000}
                  />
                </React.Profiler>
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(3);

          call = callback.mock.calls[2];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root-update');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(1100); // durations
          expect(call[3]).toBe(1124); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should properly report time in layout effects even when there are errors', () => {
          const callback = jest.fn();

          class ErrorBoundary extends React.Component {
            state = {error: null};
            static getDerivedStateFromError(error) {
              return {error};
            }
            render() {
              return this.state.error === null
                ? this.props.children
                : this.props.fallback;
            }
          }

          const ComponetWithEffects = ({
            cleanupDuration,
            duration,
            effectDuration,
            shouldThrow,
          }) => {
            React.useLayoutEffect(() => {
              Scheduler.unstable_advanceTime(effectDuration);
              if (shouldThrow) {
                throw Error('expected');
              }
              return () => {
                Scheduler.unstable_advanceTime(cleanupDuration);
              };
            });
            Scheduler.unstable_advanceTime(duration);
            return null;
          };

          Scheduler.unstable_advanceTime(1);

          // Test an error that happens during an effect

          ReactTestRenderer.act(() => {
            ReactTestRenderer.create(
              <React.Profiler id="root" onCommit={callback}>
                <ErrorBoundary
                  fallback={
                    <ComponetWithEffects
                      duration={10000000}
                      effectDuration={100000000}
                      cleanupDuration={1000000000}
                    />
                  }>
                  <ComponetWithEffects
                    duration={10}
                    effectDuration={100}
                    cleanupDuration={1000}
                    shouldThrow={true}
                  />
                </ErrorBoundary>
                <ComponetWithEffects
                  duration={10000}
                  effectDuration={100000}
                  cleanupDuration={1000000}
                />
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(2);

          let call = callback.mock.calls[0];

          // Initial render (with error)
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(100100); // durations
          expect(call[3]).toBe(10011); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          call = callback.mock.calls[1];

          // Cleanup render from error boundary
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(100000000); // durations
          expect(call[3]).toBe(10110111); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should properly report time in layout effect cleanup functions even when there are errors', () => {
          const callback = jest.fn();

          class ErrorBoundary extends React.Component {
            state = {error: null};
            static getDerivedStateFromError(error) {
              return {error};
            }
            render() {
              return this.state.error === null
                ? this.props.children
                : this.props.fallback;
            }
          }

          const ComponetWithEffects = ({
            cleanupDuration,
            duration,
            effectDuration,
            shouldThrow = false,
          }) => {
            React.useLayoutEffect(() => {
              Scheduler.unstable_advanceTime(effectDuration);
              return () => {
                Scheduler.unstable_advanceTime(cleanupDuration);
                if (shouldThrow) {
                  throw Error('expected');
                }
              };
            });
            Scheduler.unstable_advanceTime(duration);
            return null;
          };

          Scheduler.unstable_advanceTime(1);

          let renderer = null;

          ReactTestRenderer.act(() => {
            renderer = ReactTestRenderer.create(
              <React.Profiler id="root" onCommit={callback}>
                <ErrorBoundary
                  fallback={
                    <ComponetWithEffects
                      duration={10000000}
                      effectDuration={100000000}
                      cleanupDuration={1000000000}
                    />
                  }>
                  <ComponetWithEffects
                    duration={10}
                    effectDuration={100}
                    cleanupDuration={1000}
                    shouldThrow={true}
                  />
                </ErrorBoundary>
                <ComponetWithEffects
                  duration={10000}
                  effectDuration={100000}
                  cleanupDuration={1000000}
                />
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(1);

          let call = callback.mock.calls[0];

          // Initial render
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(100100); // durations
          expect(call[3]).toBe(10011); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          callback.mockClear();

          // Test an error that happens during an cleanup function

          ReactTestRenderer.act(() => {
            renderer.update(
              <React.Profiler id="root" onCommit={callback}>
                <ErrorBoundary
                  fallback={
                    <ComponetWithEffects
                      duration={10000000}
                      effectDuration={100000000}
                      cleanupDuration={1000000000}
                    />
                  }>
                  <ComponetWithEffects
                    duration={10}
                    effectDuration={100}
                    cleanupDuration={1000}
                    shouldThrow={false}
                  />
                </ErrorBoundary>
                <ComponetWithEffects
                  duration={10000}
                  effectDuration={100000}
                  cleanupDuration={1000000}
                />
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(2);

          call = callback.mock.calls[0];

          // Update (that throws)
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(1101100); // durations
          expect(call[3]).toBe(120121); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          call = callback.mock.calls[1];

          // Cleanup render from error boundary
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(100001000); // durations
          expect(call[3]).toBe(11221221); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        if (enableSchedulerTracing) {
          it('should report interactions that were active', () => {
            const callback = jest.fn();

            const ComponetWithEffects = () => {
              const [didMount, setDidMount] = React.useState(false);
              React.useLayoutEffect(() => {
                Scheduler.unstable_advanceTime(didMount ? 1000 : 100);
                if (!didMount) {
                  setDidMount(true);
                }
                return () => {
                  Scheduler.unstable_advanceTime(10000);
                };
              }, [didMount]);
              Scheduler.unstable_advanceTime(10);
              return null;
            };

            const interaction = {
              id: 0,
              name: 'mount',
              timestamp: Scheduler.unstable_now(),
            };

            Scheduler.unstable_advanceTime(1);

            SchedulerTracing.unstable_trace(
              interaction.name,
              interaction.timestamp,
              () => {
                ReactTestRenderer.create(
                  <React.Profiler id="root" onCommit={callback}>
                    <ComponetWithEffects />
                  </React.Profiler>,
                );
              },
            );

            expect(callback).toHaveBeenCalledTimes(2);

            let call = callback.mock.calls[0];

            expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
            expect(call[0]).toBe('root');
            expect(call[1]).toBe('mount');
            expect(call[4]).toMatchInteractions([interaction]);

            call = callback.mock.calls[1];

            expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
            expect(call[0]).toBe('root');
            expect(call[1]).toBe('update');
            expect(call[4]).toMatchInteractions([interaction]);
          });
        }
      });

      describe(`onPostCommit enableSchedulerTracing:${
        enableSchedulerTracing ? 'enabled' : 'disabled'
      } deferPassiveEffectCleanupDuringUnmount:${
        deferPassiveEffectCleanupDuringUnmount ? 'enabled' : 'disabled'
      }`, () => {
        beforeEach(() => {
          jest.resetModules();

          loadModules({
            deferPassiveEffectCleanupDuringUnmount,
            enableSchedulerTracing,
          });
        });

        it('should report time spent in passive effects', () => {
          const callback = jest.fn();

          const ComponetWithEffects = () => {
            React.useLayoutEffect(() => {
              // This layout effect is here to verify that its time isn't reported.
              Scheduler.unstable_advanceTime(5);
              return () => {
                Scheduler.unstable_advanceTime(7);
              };
            });
            React.useEffect(() => {
              Scheduler.unstable_advanceTime(10);
              return () => {
                Scheduler.unstable_advanceTime(100);
              };
            }, []);
            React.useEffect(() => {
              Scheduler.unstable_advanceTime(1000);
              return () => {
                Scheduler.unstable_advanceTime(10000);
              };
            });
            return null;
          };

          Scheduler.unstable_advanceTime(1);

          let renderer;
          ReactTestRenderer.act(() => {
            renderer = ReactTestRenderer.create(
              <React.Profiler id="mount-test" onPostCommit={callback}>
                <ComponetWithEffects />
              </React.Profiler>,
            );
          });
          Scheduler.unstable_flushAll();

          expect(callback).toHaveBeenCalledTimes(1);

          let call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('mount-test');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(1010); // durations
          expect(call[3]).toBe(1); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          Scheduler.unstable_advanceTime(1);

          ReactTestRenderer.act(() => {
            renderer.update(
              <React.Profiler id="update-test" onPostCommit={callback}>
                <ComponetWithEffects />
              </React.Profiler>,
            );
          });
          Scheduler.unstable_flushAll();

          expect(callback).toHaveBeenCalledTimes(2);

          call = callback.mock.calls[1];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('update-test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(11000); // durations
          expect(call[3]).toBe(1017); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          Scheduler.unstable_advanceTime(1);

          ReactTestRenderer.act(() => {
            renderer.update(
              <React.Profiler id="unmount-test" onPostCommit={callback} />,
            );
          });
          Scheduler.unstable_flushAll();

          expect(callback).toHaveBeenCalledTimes(3);

          call = callback.mock.calls[2];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('unmount-test');
          expect(call[1]).toBe('update');
          // TODO (bvaughn) The duration reported below should be 10100, but is 0
          // by the time the passive effect is flushed its parent Fiber pointer is gone.
          // If we refactor to preserve the unmounted Fiber tree we could fix this.
          // The current implementation would require too much extra overhead to track this.
          expect(call[2]).toBe(0); // durations
          expect(call[3]).toBe(12030); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should report time spent in passive effects with cascading renders', () => {
          const callback = jest.fn();

          const ComponetWithEffects = () => {
            const [didMount, setDidMount] = React.useState(false);
            React.useEffect(() => {
              if (!didMount) {
                setDidMount(true);
              }
              Scheduler.unstable_advanceTime(didMount ? 30 : 10);
              return () => {
                Scheduler.unstable_advanceTime(100);
              };
            }, [didMount]);
            return null;
          };

          Scheduler.unstable_advanceTime(1);

          ReactTestRenderer.act(() => {
            ReactTestRenderer.create(
              <React.Profiler id="mount-test" onPostCommit={callback}>
                <ComponetWithEffects />
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(2);

          let call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('mount-test');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(10); // durations
          expect(call[3]).toBe(1); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          call = callback.mock.calls[1];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('mount-test');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(130); // durations
          expect(call[3]).toBe(11); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should bubble time spent in effects to higher profilers', () => {
          const callback = jest.fn();

          const ComponetWithEffects = ({
            cleanupDuration,
            duration,
            setCountRef,
          }) => {
            const setCount = React.useState(0)[1];
            if (setCountRef != null) {
              setCountRef.current = setCount;
            }
            React.useEffect(() => {
              Scheduler.unstable_advanceTime(duration);
              return () => {
                Scheduler.unstable_advanceTime(cleanupDuration);
              };
            });
            Scheduler.unstable_advanceTime(1);
            return null;
          };

          const setCountRef = React.createRef(null);

          let renderer = null;
          ReactTestRenderer.act(() => {
            renderer = ReactTestRenderer.create(
              <React.Profiler id="root-mount" onPostCommit={callback}>
                <React.Profiler id="a">
                  <ComponetWithEffects
                    duration={10}
                    cleanupDuration={100}
                    setCountRef={setCountRef}
                  />
                </React.Profiler>
                <React.Profiler id="b">
                  <ComponetWithEffects
                    duration={1000}
                    cleanupDuration={10000}
                  />
                </React.Profiler>
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(1);

          let call = callback.mock.calls[0];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root-mount');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(1010); // durations
          expect(call[3]).toBe(2); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          ReactTestRenderer.act(() => setCountRef.current(count => count + 1));

          expect(callback).toHaveBeenCalledTimes(2);

          call = callback.mock.calls[1];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root-mount');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(110); // durations
          expect(call[3]).toBe(1013); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          ReactTestRenderer.act(() => {
            renderer.update(
              <React.Profiler id="root-update" onPostCommit={callback}>
                <React.Profiler id="b">
                  <ComponetWithEffects
                    duration={1000}
                    cleanupDuration={10000}
                  />
                </React.Profiler>
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(3);

          call = callback.mock.calls[2];

          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root-update');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(1100); // durations
          expect(call[3]).toBe(1124); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should properly report time in passive effects even when there are errors', () => {
          const callback = jest.fn();

          class ErrorBoundary extends React.Component {
            state = {error: null};
            static getDerivedStateFromError(error) {
              return {error};
            }
            render() {
              return this.state.error === null
                ? this.props.children
                : this.props.fallback;
            }
          }

          const ComponetWithEffects = ({
            cleanupDuration,
            duration,
            effectDuration,
            shouldThrow,
          }) => {
            React.useEffect(() => {
              Scheduler.unstable_advanceTime(effectDuration);
              if (shouldThrow) {
                throw Error('expected');
              }
              return () => {
                Scheduler.unstable_advanceTime(cleanupDuration);
              };
            });
            Scheduler.unstable_advanceTime(duration);
            return null;
          };

          Scheduler.unstable_advanceTime(1);

          // Test an error that happens during an effect

          ReactTestRenderer.act(() => {
            ReactTestRenderer.create(
              <React.Profiler id="root" onPostCommit={callback}>
                <ErrorBoundary
                  fallback={
                    <ComponetWithEffects
                      duration={10000000}
                      effectDuration={100000000}
                      cleanupDuration={1000000000}
                    />
                  }>
                  <ComponetWithEffects
                    duration={10}
                    effectDuration={100}
                    cleanupDuration={1000}
                    shouldThrow={true}
                  />
                </ErrorBoundary>
                <ComponetWithEffects
                  duration={10000}
                  effectDuration={100000}
                  cleanupDuration={1000000}
                />
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(2);

          let call = callback.mock.calls[0];

          // Initial render (with error)
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(100100); // durations
          expect(call[3]).toBe(10011); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          call = callback.mock.calls[1];

          // Cleanup render from error boundary
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(100000000); // durations
          expect(call[3]).toBe(10110111); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        it('should properly report time in passive effect cleanup functions even when there are errors', () => {
          const callback = jest.fn();

          class ErrorBoundary extends React.Component {
            state = {error: null};
            static getDerivedStateFromError(error) {
              return {error};
            }
            render() {
              return this.state.error === null
                ? this.props.children
                : this.props.fallback;
            }
          }

          const ComponetWithEffects = ({
            cleanupDuration,
            duration,
            effectDuration,
            shouldThrow = false,
            id,
          }) => {
            React.useEffect(() => {
              Scheduler.unstable_advanceTime(effectDuration);
              return () => {
                Scheduler.unstable_advanceTime(cleanupDuration);
                if (shouldThrow) {
                  throw Error('expected');
                }
              };
            });
            Scheduler.unstable_advanceTime(duration);
            return null;
          };

          Scheduler.unstable_advanceTime(1);

          let renderer = null;

          ReactTestRenderer.act(() => {
            renderer = ReactTestRenderer.create(
              <React.Profiler id="root" onPostCommit={callback}>
                <ErrorBoundary
                  fallback={
                    <ComponetWithEffects
                      duration={10000000}
                      effectDuration={100000000}
                      cleanupDuration={1000000000}
                    />
                  }>
                  <ComponetWithEffects
                    duration={10}
                    effectDuration={100}
                    cleanupDuration={1000}
                    shouldThrow={true}
                  />
                </ErrorBoundary>
                <ComponetWithEffects
                  duration={10000}
                  effectDuration={100000}
                  cleanupDuration={1000000}
                />
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(1);

          let call = callback.mock.calls[0];

          // Initial render
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('mount');
          expect(call[2]).toBe(100100); // durations
          expect(call[3]).toBe(10011); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          callback.mockClear();

          // Test an error that happens during an cleanup function

          ReactTestRenderer.act(() => {
            renderer.update(
              <React.Profiler id="root" onPostCommit={callback}>
                <ErrorBoundary
                  fallback={
                    <ComponetWithEffects
                      duration={10000000}
                      effectDuration={100000000}
                      cleanupDuration={1000000000}
                    />
                  }>
                  <ComponetWithEffects
                    duration={10}
                    effectDuration={100}
                    cleanupDuration={1000}
                    shouldThrow={false}
                  />
                </ErrorBoundary>
                <ComponetWithEffects
                  duration={10000}
                  effectDuration={100000}
                  cleanupDuration={1000000}
                />
              </React.Profiler>,
            );
          });

          expect(callback).toHaveBeenCalledTimes(2);

          call = callback.mock.calls[0];

          // Update (that throws)
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('update');
          // The duration varies because the flushing behavior varies when this flag is on.
          // We continue flushing pending effects even if one throws.
          expect(call[2]).toBe(
            deferPassiveEffectCleanupDuringUnmount ? 1101100 : 1101000,
          ); // durations
          expect(call[3]).toBe(120121); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events

          call = callback.mock.calls[1];

          // Cleanup render from error boundary
          expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
          expect(call[0]).toBe('root');
          expect(call[1]).toBe('update');
          expect(call[2]).toBe(100000000); // durations
          // The commit time varies because the above duration time varies
          expect(call[3]).toBe(
            deferPassiveEffectCleanupDuringUnmount ? 11221221 : 11221121,
          ); // commit start time (before mutations or effects)
          expect(call[4]).toEqual(
            enableSchedulerTracing ? new Set() : undefined,
          ); // interaction events
        });

        if (enableSchedulerTracing) {
          it('should report interactions that were active', () => {
            const callback = jest.fn();

            const ComponetWithEffects = () => {
              const [didMount, setDidMount] = React.useState(false);
              React.useEffect(() => {
                Scheduler.unstable_advanceTime(didMount ? 1000 : 100);
                if (!didMount) {
                  setDidMount(true);
                }
                return () => {
                  Scheduler.unstable_advanceTime(10000);
                };
              }, [didMount]);
              Scheduler.unstable_advanceTime(10);
              return null;
            };

            const interaction = {
              id: 0,
              name: 'mount',
              timestamp: Scheduler.unstable_now(),
            };

            Scheduler.unstable_advanceTime(1);

            ReactTestRenderer.act(() => {
              SchedulerTracing.unstable_trace(
                interaction.name,
                interaction.timestamp,
                () => {
                  ReactTestRenderer.create(
                    <React.Profiler id="root" onPostCommit={callback}>
                      <ComponetWithEffects />
                    </React.Profiler>,
                  );
                },
              );
            });

            expect(callback).toHaveBeenCalledTimes(2);

            let call = callback.mock.calls[0];

            expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
            expect(call[0]).toBe('root');
            expect(call[1]).toBe('mount');
            expect(call[4]).toMatchInteractions([interaction]);

            call = callback.mock.calls[1];

            expect(call).toHaveLength(enableSchedulerTracing ? 5 : 4);
            expect(call[0]).toBe('root');
            expect(call[1]).toBe('update');
            expect(call[4]).toMatchInteractions([interaction]);
          });
        }
      });
    });
  });

  describe('interaction tracing', () => {
    let onInteractionScheduledWorkCompleted;
    let onInteractionTraced;
    let onWorkCanceled;
    let onWorkScheduled;
    let onWorkStarted;
    let onWorkStopped;
    let throwInOnInteractionScheduledWorkCompleted;
    let throwInOnWorkScheduled;
    let throwInOnWorkStarted;
    let throwInOnWorkStopped;

    const getWorkForReactThreads = mockFn =>
      mockFn.mock.calls.filter(([interactions, threadID]) => threadID > 0);

    function loadModulesForTracing(params) {
      jest.resetModules();

      loadModules({
        enableSchedulerTracing: true,
        ...params,
      });

      throwInOnInteractionScheduledWorkCompleted = false;
      throwInOnWorkScheduled = false;
      throwInOnWorkStarted = false;
      throwInOnWorkStopped = false;

      onInteractionScheduledWorkCompleted = jest.fn(() => {
        if (throwInOnInteractionScheduledWorkCompleted) {
          throw Error('Expected error onInteractionScheduledWorkCompleted');
        }
      });
      onInteractionTraced = jest.fn();
      onWorkCanceled = jest.fn();
      onWorkScheduled = jest.fn(() => {
        if (throwInOnWorkScheduled) {
          throw Error('Expected error onWorkScheduled');
        }
      });
      onWorkStarted = jest.fn(() => {
        if (throwInOnWorkStarted) {
          throw Error('Expected error onWorkStarted');
        }
      });
      onWorkStopped = jest.fn(() => {
        if (throwInOnWorkStopped) {
          throw Error('Expected error onWorkStopped');
        }
      });

      // Verify interaction subscriber methods are called as expected.
      SchedulerTracing.unstable_subscribe({
        onInteractionScheduledWorkCompleted,
        onInteractionTraced,
        onWorkCanceled,
        onWorkScheduled,
        onWorkStarted,
        onWorkStopped,
      });
    }

    beforeEach(() => loadModulesForTracing());

    describe('error handling', () => {
      it('should cover errors thrown in onWorkScheduled', () => {
        function Component({children}) {
          Scheduler.unstable_yieldValue('Component:' + children);
          return children;
        }

        let renderer;

        // Errors that happen inside of a subscriber should throw,
        throwInOnWorkScheduled = true;
        expect(() => {
          SchedulerTracing.unstable_trace(
            'event',
            Scheduler.unstable_now(),
            () => {
              renderer = ReactTestRenderer.create(<Component>fail</Component>, {
                unstable_isConcurrent: true,
              });
            },
          );
        }).toThrow('Expected error onWorkScheduled');
        expect(Scheduler).toFlushAndYield(['Component:fail']);
        throwInOnWorkScheduled = false;
        expect(onWorkScheduled).toHaveBeenCalled();

        // But should not leave React in a broken state for subsequent renders.
        renderer = ReactTestRenderer.create(<Component>succeed</Component>, {
          unstable_isConcurrent: true,
        });
        expect(Scheduler).toFlushAndYield(['Component:succeed']);
        const tree = renderer.toTree();
        expect(tree.type).toBe(Component);
        expect(tree.props.children).toBe('succeed');
      });

      it('should cover errors thrown in onWorkStarted', () => {
        function Component({children}) {
          Scheduler.unstable_yieldValue('Component:' + children);
          return children;
        }

        let renderer;
        SchedulerTracing.unstable_trace(
          'event',
          Scheduler.unstable_now(),
          () => {
            renderer = ReactTestRenderer.create(<Component>text</Component>, {
              unstable_isConcurrent: true,
            });
          },
        );
        onWorkStarted.mockClear();

        // Errors that happen inside of a subscriber should throw,
        throwInOnWorkStarted = true;
        expect(Scheduler).toFlushAndThrow('Expected error onWorkStarted');
        // Rendering was interrupted by the error that was thrown
        expect(Scheduler).toHaveYielded([]);
        // Rendering continues in the next task
        expect(Scheduler).toFlushAndYield(['Component:text']);
        throwInOnWorkStarted = false;
        expect(onWorkStarted).toHaveBeenCalled();

        // But the React work should have still been processed.
        expect(Scheduler).toFlushAndYield([]);
        const tree = renderer.toTree();
        expect(tree.type).toBe(Component);
        expect(tree.props.children).toBe('text');
      });

      it('should cover errors thrown in onWorkStopped', () => {
        function Component({children}) {
          Scheduler.unstable_yieldValue('Component:' + children);
          return children;
        }

        let renderer;
        SchedulerTracing.unstable_trace(
          'event',
          Scheduler.unstable_now(),
          () => {
            renderer = ReactTestRenderer.create(<Component>text</Component>, {
              unstable_isConcurrent: true,
            });
          },
        );
        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        // Errors that happen in an on-stopped callback,
        throwInOnWorkStopped = true;
        expect(() => {
          expect(Scheduler).toFlushAndYield(['Component:text']);
        }).toThrow('Expected error onWorkStopped');
        throwInOnWorkStopped = false;
        expect(onWorkStopped).toHaveBeenCalledTimes(2);

        // Should still commit the update,
        const tree = renderer.toTree();
        expect(tree.type).toBe(Component);
        expect(tree.props.children).toBe('text');

        // And still call onInteractionScheduledWorkCompleted if the interaction is finished.
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      });

      it('should cover errors thrown in onInteractionScheduledWorkCompleted', () => {
        function Component({children}) {
          Scheduler.unstable_yieldValue('Component:' + children);
          return children;
        }

        const eventOne = {
          id: 0,
          name: 'event one',
          timestamp: Scheduler.unstable_now(),
        };
        const eventTwo = {
          id: 1,
          name: 'event two',
          timestamp: Scheduler.unstable_now(),
        };

        SchedulerTracing.unstable_trace(
          eventOne.name,
          Scheduler.unstable_now(),
          () => {
            SchedulerTracing.unstable_trace(
              eventTwo.name,
              Scheduler.unstable_now(),
              () => {
                ReactTestRenderer.create(<Component>text</Component>, {
                  unstable_isConcurrent: true,
                });
              },
            );
          },
        );
        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        throwInOnInteractionScheduledWorkCompleted = true;
        expect(() => {
          expect(Scheduler).toFlushAndYield(['Component:text']);
        }).toThrow('Expected error onInteractionScheduledWorkCompleted');

        // Even though an error is thrown for one completed interaction,
        // The completed callback should be called for all completed interactions.
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
      });
    });

    it('should properly trace work scheduled during the begin render phase', () => {
      const callback = jest.fn();
      let wrapped;
      const Component = jest.fn(() => {
        wrapped = SchedulerTracing.unstable_wrap(callback);
        return null;
      });

      let interaction;
      SchedulerTracing.unstable_trace('event', Scheduler.unstable_now(), () => {
        const interactions = SchedulerTracing.unstable_getCurrent();
        expect(interactions.size).toBe(1);
        interaction = Array.from(interactions)[0];
        ReactTestRenderer.create(<Component />);
      });

      expect(Component).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();

      wrapped();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interaction);
    });

    it('should associate traced events with their subsequent commits', () => {
      let instance = null;

      const Yield = ({duration = 10, value}) => {
        Scheduler.unstable_advanceTime(duration);
        Scheduler.unstable_yieldValue(value);
        return null;
      };

      class Example extends React.Component {
        state = {
          count: 0,
        };
        render() {
          instance = this;
          return (
            <React.Fragment>
              <Yield value="first" />
              {this.state.count}
              <Yield value="last" />
            </React.Fragment>
          );
        }
      }

      Scheduler.unstable_advanceTime(1);

      const interactionCreation = {
        id: 0,
        name: 'creation event',
        timestamp: Scheduler.unstable_now(),
      };

      const onPostCommit = jest.fn(() => {
        Scheduler.unstable_yieldValue('onPostCommit');
      });
      let renderer;
      SchedulerTracing.unstable_trace(
        interactionCreation.name,
        Scheduler.unstable_now(),
        () => {
          renderer = ReactTestRenderer.create(
            <React.Profiler id="test-profiler" onPostCommit={onPostCommit}>
              <Example />
            </React.Profiler>,
            {
              unstable_isConcurrent: true,
            },
          );
        },
      );

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
        interactionCreation,
      );
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      // The scheduler/tracing package will notify of work started for the default thread,
      // But React shouldn't notify until it's been flushed.
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

      // Work may have been scheduled multiple times.
      // We only care that the subscriber was notified at least once.
      // As for the thread ID- the actual value isn't important, only that there was one.
      expect(onWorkScheduled).toHaveBeenCalled();
      expect(onWorkScheduled.mock.calls[0][0]).toMatchInteractions([
        interactionCreation,
      ]);
      expect(onWorkScheduled.mock.calls[0][1] > 0).toBe(true);

      // Mount
      expect(Scheduler).toFlushAndYield(['first', 'last', 'onPostCommit']);
      expect(onPostCommit).toHaveBeenCalledTimes(1);
      let call = onPostCommit.mock.calls[0];
      expect(call[0]).toEqual('test-profiler');
      expect(call[3]).toEqual(Scheduler.unstable_now());
      if (ReactFeatureFlags.enableSchedulerTracing) {
        expect(call[4]).toMatchInteractions([interactionCreation]);
      }

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interactionCreation);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(1);
      expect(getWorkForReactThreads(onWorkStarted)[0][0]).toMatchInteractions([
        interactionCreation,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(1);
      expect(getWorkForReactThreads(onWorkStopped)[0][0]).toMatchInteractions([
        interactionCreation,
      ]);

      onPostCommit.mockClear();
      onWorkScheduled.mockClear();
      onWorkStarted.mockClear();
      onWorkStopped.mockClear();

      Scheduler.unstable_advanceTime(3);

      let didRunCallback = false;

      const interactionOne = {
        id: 1,
        name: 'initial event',
        timestamp: Scheduler.unstable_now(),
      };
      SchedulerTracing.unstable_trace(
        interactionOne.name,
        Scheduler.unstable_now(),
        () => {
          instance.setState({count: 1});

          // Update state again to verify our traced interaction isn't registered twice
          instance.setState({count: 2});

          // The scheduler/tracing package will notify of work started for the default thread,
          // But React shouldn't notify until it's been flushed.
          expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
          expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

          // Work may have been scheduled multiple times.
          // We only care that the subscriber was notified at least once.
          // As for the thread ID- the actual value isn't important, only that there was one.
          expect(onWorkScheduled).toHaveBeenCalled();
          expect(onWorkScheduled.mock.calls[0][0]).toMatchInteractions([
            interactionOne,
          ]);
          expect(onWorkScheduled.mock.calls[0][1] > 0).toBe(true);

          expect(Scheduler).toFlushAndYieldThrough(['first']);
          expect(onPostCommit).not.toHaveBeenCalled();

          expect(onInteractionTraced).toHaveBeenCalledTimes(2);
          expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
            interactionOne,
          );
          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(1);
          expect(
            getWorkForReactThreads(onWorkStarted)[0][0],
          ).toMatchInteractions([interactionOne]);
          expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

          expect(Scheduler).toFlushAndYield(['last', 'onPostCommit']);
          expect(onPostCommit).toHaveBeenCalledTimes(1);

          call = onPostCommit.mock.calls[0];
          expect(call[0]).toEqual('test-profiler');
          expect(call[3]).toEqual(Scheduler.unstable_now());
          if (ReactFeatureFlags.enableSchedulerTracing) {
            expect(call[4]).toMatchInteractions([interactionOne]);
          }

          didRunCallback = true;

          expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(1);
          expect(
            getWorkForReactThreads(onWorkStarted)[0][0],
          ).toMatchInteractions([interactionOne]);
          expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(1);
          expect(
            getWorkForReactThreads(onWorkStopped)[0][0],
          ).toMatchInteractions([interactionOne]);
        },
      );

      expect(didRunCallback).toBe(true);

      onPostCommit.mockClear();
      onWorkScheduled.mockClear();
      onWorkStarted.mockClear();
      onWorkStopped.mockClear();

      Scheduler.unstable_advanceTime(17);

      // Verify that updating state again does not re-log our interaction.
      instance.setState({count: 3});
      expect(Scheduler).toFlushAndYield(['first', 'last', 'onPostCommit']);

      expect(onPostCommit).toHaveBeenCalledTimes(1);
      call = onPostCommit.mock.calls[0];
      expect(call[0]).toEqual('test-profiler');
      expect(call[3]).toEqual(Scheduler.unstable_now());
      if (ReactFeatureFlags.enableSchedulerTracing) {
        expect(call[4]).toMatchInteractions([]);
      }

      expect(onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interactionOne);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

      onPostCommit.mockClear();

      Scheduler.unstable_advanceTime(3);

      // Verify that root updates are also associated with traced events.
      const interactionTwo = {
        id: 2,
        name: 'root update event',
        timestamp: Scheduler.unstable_now(),
      };
      SchedulerTracing.unstable_trace(
        interactionTwo.name,
        Scheduler.unstable_now(),
        () => {
          renderer.update(
            <React.Profiler id="test-profiler" onPostCommit={onPostCommit}>
              <Example />
            </React.Profiler>,
          );
        },
      );

      expect(onInteractionTraced).toHaveBeenCalledTimes(3);
      expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
        interactionTwo,
      );
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);

      // The scheduler/tracing package will notify of work started for the default thread,
      // But React shouldn't notify until it's been flushed.
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

      // Work may have been scheduled multiple times.
      // We only care that the subscriber was notified at least once.
      // As for the thread ID- the actual value isn't important, only that there was one.
      expect(onWorkScheduled).toHaveBeenCalled();
      expect(onWorkScheduled.mock.calls[0][0]).toMatchInteractions([
        interactionTwo,
      ]);
      expect(onWorkScheduled.mock.calls[0][1] > 0).toBe(true);

      expect(Scheduler).toFlushAndYield(['first', 'last', 'onPostCommit']);

      expect(onPostCommit).toHaveBeenCalledTimes(1);
      call = onPostCommit.mock.calls[0];
      expect(call[0]).toEqual('test-profiler');
      expect(call[3]).toEqual(Scheduler.unstable_now());
      if (ReactFeatureFlags.enableSchedulerTracing) {
        expect(call[4]).toMatchInteractions([interactionTwo]);
      }

      expect(onInteractionTraced).toHaveBeenCalledTimes(3);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(3);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interactionTwo);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(1);
      expect(getWorkForReactThreads(onWorkStarted)[0][0]).toMatchInteractions([
        interactionTwo,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(1);
      expect(getWorkForReactThreads(onWorkStopped)[0][0]).toMatchInteractions([
        interactionTwo,
      ]);
    });

    it('should not mark an interaction complete while passive effects are outstanding', () => {
      const onCommit = jest.fn();
      const onPostCommit = jest.fn(() => {
        Scheduler.unstable_yieldValue('onPostCommit');
      });

      const ComponetWithEffects = () => {
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive effect');
        });
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout effect');
        });
        Scheduler.unstable_yieldValue('render');
        return null;
      };

      SchedulerTracing.unstable_trace('mount', Scheduler.unstable_now(), () => {
        ReactTestRenderer.create(
          <React.Profiler
            id="root"
            onCommit={onCommit}
            onPostCommit={onPostCommit}>
            <ComponetWithEffects />
          </React.Profiler>,
        );
      });

      expect(Scheduler).toHaveYielded(['render', 'layout effect']);

      expect(onCommit).toHaveBeenCalled();
      expect(onPostCommit).not.toHaveBeenCalled();
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      expect(Scheduler).toFlushAndYield(['passive effect', 'onPostCommit']);

      expect(onCommit).toHaveBeenCalled();
      expect(onPostCommit).toHaveBeenCalled();
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
    });

    it('should report the expected times when a high-priority update interrupts a low-priority update', () => {
      const onPostCommit = jest.fn(() => {
        Scheduler.unstable_yieldValue('onPostCommit');
      });

      let first;
      class FirstComponent extends React.Component {
        state = {count: 0};
        render() {
          first = this;
          Scheduler.unstable_yieldValue('FirstComponent');
          return null;
        }
      }
      let second;
      class SecondComponent extends React.Component {
        state = {count: 0};
        render() {
          second = this;
          Scheduler.unstable_yieldValue('SecondComponent');
          return null;
        }
      }

      Scheduler.unstable_advanceTime(5);

      const renderer = ReactTestRenderer.create(
        <React.Profiler id="test" onPostCommit={onPostCommit}>
          <FirstComponent />
          <SecondComponent />
        </React.Profiler>,
        {unstable_isConcurrent: true},
      );

      // Initial mount.
      expect(Scheduler).toFlushAndYield([
        'FirstComponent',
        'SecondComponent',
        'onPostCommit',
      ]);

      expect(onInteractionTraced).not.toHaveBeenCalled();
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      onPostCommit.mockClear();

      Scheduler.unstable_advanceTime(100);

      const interactionLowPri = {
        id: 0,
        name: 'lowPri',
        timestamp: Scheduler.unstable_now(),
      };

      SchedulerTracing.unstable_trace(
        interactionLowPri.name,
        Scheduler.unstable_now(),
        () => {
          // Render a partially update, but don't finish.
          first.setState({count: 1});

          expect(onWorkScheduled).toHaveBeenCalled();
          expect(onWorkScheduled.mock.calls[0][0]).toMatchInteractions([
            interactionLowPri,
          ]);

          expect(Scheduler).toFlushAndYieldThrough(['FirstComponent']);
          expect(onPostCommit).not.toHaveBeenCalled();

          expect(onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
            interactionLowPri,
          );
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
          expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(1);
          expect(
            getWorkForReactThreads(onWorkStarted)[0][0],
          ).toMatchInteractions([interactionLowPri]);
          expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

          Scheduler.unstable_advanceTime(100);

          const interactionHighPri = {
            id: 1,
            name: 'highPri',
            timestamp: Scheduler.unstable_now(),
          };

          // Interrupt with higher priority work.
          // This simulates a total of 37ms of actual render time.
          renderer.unstable_flushSync(() => {
            SchedulerTracing.unstable_trace(
              interactionHighPri.name,
              Scheduler.unstable_now(),
              () => {
                second.setState({count: 1});

                expect(onInteractionTraced).toHaveBeenCalledTimes(2);
                expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
                  interactionHighPri,
                );
                expect(
                  onInteractionScheduledWorkCompleted,
                ).not.toHaveBeenCalled();

                expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(1);
                expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);
              },
            );
          });

          // Profiler tag causes passive effects to be scheduled,
          // so the interactions are still not completed.
          expect(Scheduler).toHaveYielded(['SecondComponent']);
          expect(onInteractionTraced).toHaveBeenCalledTimes(2);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
          expect(Scheduler).toFlushAndYieldThrough(['onPostCommit']);

          expect(onInteractionTraced).toHaveBeenCalledTimes(2);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(
            onInteractionScheduledWorkCompleted,
          ).toHaveBeenLastNotifiedOfInteraction(interactionHighPri);

          // Verify the high priority update was associated with the high priority event.
          expect(onPostCommit).toHaveBeenCalledTimes(1);
          let call = onPostCommit.mock.calls[0];
          expect(call[0]).toEqual('test');
          expect(call[3]).toEqual(Scheduler.unstable_now());
          expect(call[4]).toMatchInteractions(
            ReactFeatureFlags.enableSchedulerTracing
              ? [interactionLowPri, interactionHighPri]
              : [],
          );

          onPostCommit.mockClear();

          Scheduler.unstable_advanceTime(100);

          // Resume the original low priority update, with rebased state.
          // Verify the low priority update was retained.
          expect(Scheduler).toFlushAndYield(['FirstComponent', 'onPostCommit']);
          expect(onPostCommit).toHaveBeenCalledTimes(1);
          call = onPostCommit.mock.calls[0];
          expect(call[0]).toEqual('test');
          expect(call[3]).toEqual(Scheduler.unstable_now());
          expect(call[4]).toMatchInteractions(
            ReactFeatureFlags.enableSchedulerTracing ? [interactionLowPri] : [],
          );

          expect(onInteractionTraced).toHaveBeenCalledTimes(2);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);

          // Work might be started multiple times before being completed.
          // This is okay; it's part of the scheduler/tracing contract.
          expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(3);
          expect(
            getWorkForReactThreads(onWorkStarted)[1][0],
          ).toMatchInteractions([interactionLowPri, interactionHighPri]);
          expect(
            getWorkForReactThreads(onWorkStarted)[2][0],
          ).toMatchInteractions([interactionLowPri]);
          expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(2);
          expect(
            getWorkForReactThreads(onWorkStopped)[0][0],
          ).toMatchInteractions([interactionLowPri, interactionHighPri]);
          expect(
            getWorkForReactThreads(onWorkStopped)[1][0],
          ).toMatchInteractions([interactionLowPri]);
        },
      );

      expect(onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interactionLowPri);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(3);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(2);
    });

    it('should trace work spawned by a commit phase lifecycle and setState callback', () => {
      let instance;
      class Example extends React.Component {
        state = {
          count: 0,
        };
        componentDidMount() {
          Scheduler.unstable_advanceTime(10); // Advance timer to keep commits separate
          this.setState({count: 1}); // Intentional cascading update
        }
        componentDidUpdate(prevProps, prevState) {
          if (this.state.count === 2 && prevState.count === 1) {
            Scheduler.unstable_advanceTime(10); // Advance timer to keep commits separate
            this.setState({count: 3}); // Intentional cascading update
          }
        }
        render() {
          instance = this;
          Scheduler.unstable_yieldValue('Example:' + this.state.count);
          return null;
        }
      }

      const interactionOne = {
        id: 0,
        name: 'componentDidMount test',
        timestamp: Scheduler.unstable_now(),
      };

      // Initial mount.
      const onPostCommit = jest.fn(() => {
        Scheduler.unstable_yieldValue('onPostCommit');
      });
      let firstCommitTime = Scheduler.unstable_now();
      SchedulerTracing.unstable_trace(
        interactionOne.name,
        Scheduler.unstable_now(),
        () => {
          ReactTestRenderer.create(
            <React.Profiler id="test" onPostCommit={onPostCommit}>
              <Example />
            </React.Profiler>,
            {unstable_isConcurrent: true},
          );
        },
      );

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
        interactionOne,
      );
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

      expect(Scheduler).toFlushAndYield([
        'Example:0',
        'onPostCommit',
        'Example:1',
        'onPostCommit',
      ]);

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interactionOne);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(2);
      expect(getWorkForReactThreads(onWorkStarted)[0][0]).toMatchInteractions([
        interactionOne,
      ]);
      expect(getWorkForReactThreads(onWorkStarted)[1][0]).toMatchInteractions([
        interactionOne,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(2);
      expect(getWorkForReactThreads(onWorkStopped)[0][0]).toMatchInteractions([
        interactionOne,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)[1][0]).toMatchInteractions([
        interactionOne,
      ]);

      expect(onPostCommit).toHaveBeenCalledTimes(2);
      let call = onPostCommit.mock.calls[0];
      expect(call[0]).toEqual('test');
      expect(call[3]).toEqual(firstCommitTime);
      expect(call[4]).toMatchInteractions(
        ReactFeatureFlags.enableSchedulerTracing ? [interactionOne] : [],
      );
      call = onPostCommit.mock.calls[1];
      expect(call[0]).toEqual('test');
      expect(call[3]).toEqual(Scheduler.unstable_now());
      expect(call[4]).toMatchInteractions(
        ReactFeatureFlags.enableSchedulerTracing ? [interactionOne] : [],
      );

      onPostCommit.mockClear();

      const interactionTwo = {
        id: 1,
        name: 'componentDidUpdate test',
        timestamp: Scheduler.unstable_now(),
      };

      // Cause an traced, async update
      SchedulerTracing.unstable_trace(
        interactionTwo.name,
        Scheduler.unstable_now(),
        () => {
          instance.setState({count: 2});
        },
      );
      expect(onPostCommit).not.toHaveBeenCalled();
      expect(onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
        interactionTwo,
      );
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(2);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(2);

      Scheduler.unstable_advanceTime(5);

      // Flush async work (outside of traced scope)
      // This will cause an intentional cascading update from did-update
      firstCommitTime = Scheduler.unstable_now();
      expect(Scheduler).toFlushAndYield([
        'Example:2',
        'onPostCommit',
        'Example:3',
        'onPostCommit',
      ]);

      expect(onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interactionTwo);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(4);
      expect(getWorkForReactThreads(onWorkStarted)[2][0]).toMatchInteractions([
        interactionTwo,
      ]);
      expect(getWorkForReactThreads(onWorkStarted)[3][0]).toMatchInteractions([
        interactionTwo,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(4);
      expect(getWorkForReactThreads(onWorkStopped)[2][0]).toMatchInteractions([
        interactionTwo,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)[3][0]).toMatchInteractions([
        interactionTwo,
      ]);

      // Verify the cascading commit is associated with the origin event
      expect(onPostCommit).toHaveBeenCalledTimes(2);
      call = onPostCommit.mock.calls[0];
      expect(call[0]).toEqual('test');
      expect(call[3]).toEqual(firstCommitTime);
      expect(call[4]).toMatchInteractions(
        ReactFeatureFlags.enableSchedulerTracing ? [interactionTwo] : [],
      );
      call = onPostCommit.mock.calls[1];
      expect(call[0]).toEqual('test');
      expect(call[3]).toEqual(Scheduler.unstable_now());
      expect(call[4]).toMatchInteractions(
        ReactFeatureFlags.enableSchedulerTracing ? [interactionTwo] : [],
      );

      onPostCommit.mockClear();

      const interactionThree = {
        id: 2,
        name: 'setState callback test',
        timestamp: Scheduler.unstable_now(),
      };

      // Cause a cascading update from the setState callback
      function callback() {
        instance.setState({count: 6});
      }
      SchedulerTracing.unstable_trace(
        interactionThree.name,
        Scheduler.unstable_now(),
        () => {
          instance.setState({count: 5}, callback);
        },
      );
      expect(onPostCommit).not.toHaveBeenCalled();

      expect(onInteractionTraced).toHaveBeenCalledTimes(3);
      expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
        interactionThree,
      );
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(4);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(4);

      // Flush async work (outside of traced scope)
      // This will cause an intentional cascading update from the setState callback
      firstCommitTime = Scheduler.unstable_now();
      expect(Scheduler).toFlushAndYield([
        'Example:5',
        'onPostCommit',
        'Example:6',
        'onPostCommit',
      ]);

      expect(onInteractionTraced).toHaveBeenCalledTimes(3);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(3);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interactionThree);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(6);
      expect(getWorkForReactThreads(onWorkStarted)[4][0]).toMatchInteractions([
        interactionThree,
      ]);
      expect(getWorkForReactThreads(onWorkStarted)[5][0]).toMatchInteractions([
        interactionThree,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(6);
      expect(getWorkForReactThreads(onWorkStopped)[4][0]).toMatchInteractions([
        interactionThree,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)[5][0]).toMatchInteractions([
        interactionThree,
      ]);

      // Verify the cascading commit is associated with the origin event
      expect(onPostCommit).toHaveBeenCalledTimes(2);
      call = onPostCommit.mock.calls[0];
      expect(call[0]).toEqual('test');
      expect(call[3]).toEqual(firstCommitTime);
      expect(call[4]).toMatchInteractions(
        ReactFeatureFlags.enableSchedulerTracing ? [interactionThree] : [],
      );
      call = onPostCommit.mock.calls[1];
      expect(call[0]).toEqual('test');
      expect(call[3]).toEqual(Scheduler.unstable_now());
      expect(call[4]).toMatchInteractions(
        ReactFeatureFlags.enableSchedulerTracing ? [interactionThree] : [],
      );
    });

    it('should trace interactions associated with a parent component state update', () => {
      const onPostCommit = jest.fn(() => {
        Scheduler.unstable_yieldValue('onPostCommit');
      });
      let parentInstance = null;

      class Child extends React.Component {
        render() {
          Scheduler.unstable_yieldValue('Child:' + this.props.count);
          return null;
        }
      }

      class Parent extends React.Component {
        state = {
          count: 0,
        };
        render() {
          parentInstance = this;
          return (
            <React.Profiler id="test-profiler" onPostCommit={onPostCommit}>
              <Child count={this.state.count} />
            </React.Profiler>
          );
        }
      }

      Scheduler.unstable_advanceTime(1);

      ReactTestRenderer.create(<Parent />, {
        unstable_isConcurrent: true,
      });
      expect(Scheduler).toFlushAndYield(['Child:0', 'onPostCommit']);
      onPostCommit.mockClear();

      const interaction = {
        id: 0,
        name: 'parent interaction',
        timestamp: Scheduler.unstable_now(),
      };

      SchedulerTracing.unstable_trace(
        interaction.name,
        Scheduler.unstable_now(),
        () => {
          parentInstance.setState({count: 1});
        },
      );

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
        interaction,
      );
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

      expect(onPostCommit).not.toHaveBeenCalled();
      expect(Scheduler).toFlushAndYield(['Child:1', 'onPostCommit']);
      expect(onPostCommit).toHaveBeenCalledTimes(1);
      const call = onPostCommit.mock.calls[0];
      expect(call[0]).toEqual('test-profiler');
      expect(call[4]).toMatchInteractions(
        ReactFeatureFlags.enableSchedulerTracing ? [interaction] : [],
      );

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(interaction);
      expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(1);
      expect(getWorkForReactThreads(onWorkStarted)[0][0]).toMatchInteractions([
        interaction,
      ]);
      expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(1);
      expect(getWorkForReactThreads(onWorkStopped)[0][0]).toMatchInteractions([
        interaction,
      ]);
    });

    describe('suspense', () => {
      function awaitableAdvanceTimers(ms) {
        jest.advanceTimersByTime(ms);
        // Wait until the end of the current tick
        // We cannot use a timer since we're faking them
        return Promise.resolve().then(() => {});
      }

      it('traces both the temporary placeholder and the finished render for an interaction', async () => {
        loadModulesForTracing({useNoopRenderer: true});

        const interaction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        const monkey = React.createRef();
        class Monkey extends React.Component {
          render() {
            Scheduler.unstable_yieldValue('Monkey');
            return null;
          }
        }

        const onPostCommit = jest.fn(() => {
          Scheduler.unstable_yieldValue('onPostCommit');
        });
        SchedulerTracing.unstable_trace(
          interaction.name,
          Scheduler.unstable_now(),
          () => {
            ReactNoop.render(
              <React.Profiler id="test-profiler" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="Loading..." />}>
                  <AsyncText text="Async" ms={20000} />
                </React.Suspense>
                <Text text="Sync" />
                <Monkey ref={monkey} />
              </React.Profiler>,
            );
          },
        );

        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
          interaction,
        );
        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
        expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
        expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

        expect(Scheduler).toFlushAndYield([
          'Suspend [Async]',
          'Text [Loading...]',
          'Text [Sync]',
          'Monkey',
          'onPostCommit',
        ]);
        // Should have committed the placeholder.
        expect(ReactNoop.getChildrenAsJSX()).toEqual('Loading...Sync');
        expect(onPostCommit).toHaveBeenCalledTimes(1);

        let call = onPostCommit.mock.calls[0];
        expect(call[0]).toEqual('test-profiler');
        expect(call[4]).toMatchInteractions(
          ReactFeatureFlags.enableSchedulerTracing ? [interaction] : [],
        );

        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        // An unrelated update in the middle shouldn't affect things...
        monkey.current.forceUpdate();
        expect(Scheduler).toFlushAndYield(['Monkey', 'onPostCommit']);
        expect(onPostCommit).toHaveBeenCalledTimes(2);

        // Once the promise resolves, we render the suspended view
        await awaitableAdvanceTimers(20000);
        expect(Scheduler).toHaveYielded(['Promise resolved [Async]']);
        expect(Scheduler).toFlushAndYield([
          'AsyncText [Async]',
          'onPostCommit',
        ]);
        expect(ReactNoop.getChildrenAsJSX()).toEqual('AsyncSync');
        expect(onPostCommit).toHaveBeenCalledTimes(3);

        call = onPostCommit.mock.calls[2];
        expect(call[0]).toEqual('test-profiler');
        expect(call[4]).toMatchInteractions(
          ReactFeatureFlags.enableSchedulerTracing ? [interaction] : [],
        );

        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
      });

      it('does not prematurely complete for suspended sync renders', async () => {
        const interaction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        const onPostCommit = jest.fn(() =>
          Scheduler.unstable_yieldValue('onPostCommit'),
        );
        SchedulerTracing.unstable_trace(
          interaction.name,
          interaction.timestamp,
          () => {
            ReactTestRenderer.create(
              <React.Profiler id="app" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="loading" />}>
                  <AsyncText text="loaded" ms={500} />
                </React.Suspense>
              </React.Profiler>,
            );
          },
        );

        expect(Scheduler).toHaveYielded(['Suspend [loaded]', 'Text [loading]']);

        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        jest.runAllTimers();
        await resourcePromise;

        expect(Scheduler).toHaveYielded(['Promise resolved [loaded]']);
        expect(Scheduler).toFlushExpired([
          'onPostCommit',
          'AsyncText [loaded]',
        ]);
        expect(Scheduler).toFlushAndYield(['onPostCommit']);
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
      });

      it('traces cascading work after suspended sync renders', async () => {
        let wrappedCascadingFn;
        class AsyncComponentWithCascadingWork extends React.Component {
          state = {
            hasMounted: false,
          };

          componentDidMount() {
            wrappedCascadingFn = SchedulerTracing.unstable_wrap(() => {
              this.setState({hasMounted: true});
            });
          }

          render() {
            Scheduler.unstable_yieldValue('render');
            const {ms, text} = this.props;
            TextResource.read([text, ms]);
            return <span prop={text}>{this.state.hasMounted}</span>;
          }
        }

        const interaction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        const onPostCommit = jest.fn(() =>
          Scheduler.unstable_yieldValue('onPostCommit'),
        );
        SchedulerTracing.unstable_trace(
          interaction.name,
          interaction.timestamp,
          () => {
            ReactTestRenderer.create(
              <React.Profiler id="app" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="loading" />}>
                  <AsyncComponentWithCascadingWork text="loaded" ms={500} />
                </React.Suspense>
              </React.Profiler>,
            );
          },
        );

        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        expect(Scheduler).toHaveYielded(['render', 'Text [loading]']);

        jest.runAllTimers();
        await resourcePromise;

        expect(Scheduler).toHaveYielded(['Promise resolved [loaded]']);
        expect(Scheduler).toFlushExpired(['onPostCommit', 'render']);

        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        wrappedCascadingFn();
        expect(Scheduler).toHaveYielded(['onPostCommit', 'render']);
        expect(Scheduler).toFlushAndYield(['onPostCommit']);

        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
      });

      it('does not prematurely complete for suspended renders that have exceeded their deadline', async () => {
        const interaction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        const onPostCommit = jest.fn(() => {
          Scheduler.unstable_yieldValue('onPostCommit');
        });
        SchedulerTracing.unstable_trace(
          interaction.name,
          interaction.timestamp,
          () => {
            ReactTestRenderer.create(
              <React.Profiler id="app" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="loading" />}>
                  <AsyncText text="loaded" ms={500} />
                </React.Suspense>
              </React.Profiler>,
              {
                unstable_isConcurrent: true,
              },
            );
          },
        );

        Scheduler.unstable_advanceTime(400);
        await awaitableAdvanceTimers(400);

        expect(Scheduler).toFlushAndYield([
          'Suspend [loaded]',
          'Text [loading]',
          'onPostCommit',
        ]);
        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        Scheduler.unstable_advanceTime(500);
        await awaitableAdvanceTimers(500);

        expect(Scheduler).toHaveYielded(['Promise resolved [loaded]']);
        expect(Scheduler).toFlushAndYield([
          'AsyncText [loaded]',
          'onPostCommit',
        ]);
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
      });

      it('decrements interaction count correctly if suspense loads before placeholder is shown', async () => {
        const interaction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        const onPostCommit = jest.fn(() => {
          Scheduler.unstable_yieldValue('onPostCommit');
        });
        SchedulerTracing.unstable_trace(
          interaction.name,
          interaction.timestamp,
          () => {
            ReactTestRenderer.create(
              <React.Profiler id="app" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="loading" />}>
                  <AsyncText text="loaded" ms={100} />
                </React.Suspense>
              </React.Profiler>,
              {unstable_isConcurrent: true},
            );
          },
        );
        expect(Scheduler).toFlushAndYield([
          'Suspend [loaded]',
          'Text [loading]',
          'onPostCommit',
        ]);

        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);
        await resourcePromise;
        expect(Scheduler).toHaveYielded(['Promise resolved [loaded]']);
        expect(Scheduler).toFlushAndYield([
          'AsyncText [loaded]',
          'onPostCommit',
        ]);

        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
      });

      it('handles high-pri renderers between suspended and resolved (sync) trees', async () => {
        const initialRenderInteraction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        const onPostCommit = jest.fn(() =>
          Scheduler.unstable_yieldValue('onPostCommit'),
        );
        let renderer;
        SchedulerTracing.unstable_trace(
          initialRenderInteraction.name,
          initialRenderInteraction.timestamp,
          () => {
            renderer = ReactTestRenderer.create(
              <React.Profiler id="app" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="loading" />}>
                  <AsyncText text="loaded" ms={100} />
                </React.Suspense>
                <Text text="initial" />
              </React.Profiler>,
            );
          },
        );
        expect(renderer.toJSON()).toEqual(['loading', 'initial']);
        expect(Scheduler).toHaveYielded([
          'Suspend [loaded]',
          'Text [loading]',
          'Text [initial]',
        ]);
        expect(Scheduler).toFlushAndYield(['onPostCommit']);

        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
        expect(onPostCommit).toHaveBeenCalledTimes(1);
        expect(onPostCommit.mock.calls[0][4]).toMatchInteractions([
          initialRenderInteraction,
        ]);
        onPostCommit.mockClear();

        const highPriUpdateInteraction = {
          id: 1,
          name: 'hiPriUpdate',
          timestamp: Scheduler.unstable_now(),
        };

        const originalPromise = resourcePromise;

        renderer.unstable_flushSync(() => {
          SchedulerTracing.unstable_trace(
            highPriUpdateInteraction.name,
            highPriUpdateInteraction.timestamp,
            () => {
              renderer.update(
                <React.Profiler id="app" onPostCommit={onPostCommit}>
                  <React.Suspense fallback={<Text text="loading" />}>
                    <AsyncText text="loaded" ms={100} />
                  </React.Suspense>
                  <Text text="updated" />
                </React.Profiler>,
              );
            },
          );
        });
        expect(renderer.toJSON()).toEqual(['loading', 'updated']);
        expect(Scheduler).toHaveYielded([
          'Suspend [loaded]',
          'Text [loading]',
          'Text [updated]',
        ]);
        expect(Scheduler).toFlushAndYield(['onPostCommit']);

        expect(onPostCommit).toHaveBeenCalledTimes(1);
        expect(onPostCommit.mock.calls[0][4]).toMatchInteractions([
          highPriUpdateInteraction,
        ]);
        onPostCommit.mockClear();

        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted.mock.calls[0][0],
        ).toMatchInteraction(highPriUpdateInteraction);
        onInteractionScheduledWorkCompleted.mockClear();

        Scheduler.unstable_advanceTime(100);
        jest.advanceTimersByTime(100);
        await originalPromise;

        expect(Scheduler).toHaveYielded(['Promise resolved [loaded]']);
        expect(Scheduler).toFlushExpired(['AsyncText [loaded]']);
        expect(renderer.toJSON()).toEqual(['loaded', 'updated']);
        expect(Scheduler).toFlushAndYield(['onPostCommit']);

        expect(onPostCommit).toHaveBeenCalledTimes(1);
        expect(onPostCommit.mock.calls[0][4]).toMatchInteractions([
          initialRenderInteraction,
        ]);

        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted.mock.calls[0][0],
        ).toMatchInteraction(initialRenderInteraction);
      });

      it('handles high-pri renderers between suspended and resolved (async) trees', async () => {
        // Set up an initial shell. We need to set this up before the test sceanrio
        // because we want initial render to suspend on navigation to the initial state.
        const renderer = ReactTestRenderer.create(
          <React.Profiler id="app" onRender={() => {}}>
            <React.Suspense fallback={<Text text="loading" />} />
          </React.Profiler>,
          {unstable_isConcurrent: true},
        );
        expect(Scheduler).toFlushAndYield([]);

        const initialRenderInteraction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        const onPostCommit = jest.fn(() => {
          Scheduler.unstable_yieldValue('onPostCommit');
        });
        SchedulerTracing.unstable_trace(
          initialRenderInteraction.name,
          initialRenderInteraction.timestamp,
          () => {
            renderer.update(
              <React.Profiler id="app" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="loading" />}>
                  <AsyncText text="loaded" ms={100} />
                </React.Suspense>
                <Text text="initial" />
              </React.Profiler>,
            );
          },
        );
        expect(Scheduler).toFlushAndYield([
          'Suspend [loaded]',
          'Text [loading]',
          'Text [initial]',
        ]);

        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
        expect(onPostCommit).not.toHaveBeenCalled();

        Scheduler.unstable_advanceTime(50);
        jest.advanceTimersByTime(50);

        const highPriUpdateInteraction = {
          id: 1,
          name: 'hiPriUpdate',
          timestamp: Scheduler.unstable_now(),
        };

        const originalPromise = resourcePromise;

        renderer.unstable_flushSync(() => {
          SchedulerTracing.unstable_trace(
            highPriUpdateInteraction.name,
            highPriUpdateInteraction.timestamp,
            () => {
              renderer.update(
                <React.Profiler id="app" onPostCommit={onPostCommit}>
                  <React.Suspense fallback={<Text text="loading" />}>
                    <AsyncText text="loaded" ms={100} />
                  </React.Suspense>
                  <Text text="updated" />
                </React.Profiler>,
              );
            },
          );
        });
        expect(Scheduler).toHaveYielded([
          'Suspend [loaded]',
          'Text [loading]',
          'Text [updated]',
        ]);
        expect(Scheduler).toFlushAndYieldThrough(['onPostCommit']);
        expect(renderer.toJSON()).toEqual(['loading', 'updated']);

        expect(onPostCommit).toHaveBeenCalledTimes(1);
        expect(onPostCommit.mock.calls[0][4]).toMatchInteractions([
          highPriUpdateInteraction,
        ]);
        onPostCommit.mockClear();

        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(0);

        Scheduler.unstable_advanceTime(50);
        jest.advanceTimersByTime(50);
        await originalPromise;
        expect(Scheduler).toHaveYielded(['Promise resolved [loaded]']);
        expect(Scheduler).toFlushAndYield([
          'AsyncText [loaded]',
          'onPostCommit',
        ]);
        expect(renderer.toJSON()).toEqual(['loaded', 'updated']);

        expect(onPostCommit).toHaveBeenCalledTimes(1);
        expect(onPostCommit.mock.calls[0][4]).toMatchInteractions([
          initialRenderInteraction,
          highPriUpdateInteraction,
        ]);

        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
        expect(
          onInteractionScheduledWorkCompleted.mock.calls[0][0],
        ).toMatchInteraction(initialRenderInteraction);
        expect(
          onInteractionScheduledWorkCompleted.mock.calls[1][0],
        ).toMatchInteraction(highPriUpdateInteraction);
      });

      it('does not trace Promises flagged with __reactDoNotTraceInteractions', async () => {
        loadModulesForTracing({useNoopRenderer: true});

        const interaction = {
          id: 0,
          name: 'initial render',
          timestamp: Scheduler.unstable_now(),
        };

        AsyncText = ({ms, text}) => {
          try {
            TextResource.read([text, ms]);
            Scheduler.unstable_yieldValue(`AsyncText [${text}]`);
            return text;
          } catch (promise) {
            promise.__reactDoNotTraceInteractions = true;

            if (typeof promise.then === 'function') {
              Scheduler.unstable_yieldValue(`Suspend [${text}]`);
            } else {
              Scheduler.unstable_yieldValue(`Error [${text}]`);
            }
            throw promise;
          }
        };

        const onPostCommit = jest.fn(() => {
          Scheduler.unstable_yieldValue('onPostCommit');
        });
        SchedulerTracing.unstable_trace(
          interaction.name,
          Scheduler.unstable_now(),
          () => {
            ReactNoop.render(
              <React.Profiler id="test-profiler" onPostCommit={onPostCommit}>
                <React.Suspense fallback={<Text text="Loading..." />}>
                  <AsyncText text="Async" ms={20000} />
                </React.Suspense>
                <Text text="Sync" />
              </React.Profiler>,
            );
          },
        );

        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
          interaction,
        );
        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
        expect(getWorkForReactThreads(onWorkStarted)).toHaveLength(0);
        expect(getWorkForReactThreads(onWorkStopped)).toHaveLength(0);

        expect(Scheduler).toFlushAndYield([
          'Suspend [Async]',
          'Text [Loading...]',
          'Text [Sync]',
          'onPostCommit',
        ]);
        // Should have committed the placeholder.
        expect(ReactNoop.getChildrenAsJSX()).toEqual('Loading...Sync');
        expect(onPostCommit).toHaveBeenCalledTimes(1);

        let call = onPostCommit.mock.calls[0];
        expect(call[0]).toEqual('test-profiler');
        expect(call[4]).toMatchInteractions(
          ReactFeatureFlags.enableSchedulerTracing ? [interaction] : [],
        );

        // The interaction is now complete.
        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);

        // Once the promise resolves, we render the suspended view
        await awaitableAdvanceTimers(20000);
        expect(Scheduler).toHaveYielded(['Promise resolved [Async]']);
        expect(Scheduler).toFlushAndYield([
          'AsyncText [Async]',
          'onPostCommit',
        ]);
        expect(ReactNoop.getChildrenAsJSX()).toEqual('AsyncSync');
        expect(onPostCommit).toHaveBeenCalledTimes(2);

        // No interactions should be associated with this update.
        call = onPostCommit.mock.calls[1];
        expect(call[0]).toEqual('test-profiler');
        expect(call[4]).toMatchInteractions([]);
      });
    });
  });
});
