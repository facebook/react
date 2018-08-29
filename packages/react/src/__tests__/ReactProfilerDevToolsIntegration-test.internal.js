/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

describe('ReactProfiler DevTools integration', () => {
  let React;
  let ReactFeatureFlags;
  let ReactTestRenderer;
  let InteractionTracking;
  let AdvanceTime;
  let advanceTimeBy;
  let hook;
  let mockNow;

  beforeEach(() => {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook = {
      inject: () => {},
      onCommitFiberRoot: jest.fn((rendererId, root) => {}),
      onCommitFiberUnmount: () => {},
      supportsFiber: true,
    };

    jest.resetModules();

    let currentTime = 0;

    mockNow = jest.fn().mockImplementation(() => currentTime);

    global.Date.now = mockNow;

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableProfilerTimer = true;
    ReactFeatureFlags.enableInteractionTracking = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    InteractionTracking = require('interaction-tracking');

    ReactTestRenderer.unstable_setNowImplementation(mockNow);
    advanceTimeBy = amount => {
      currentTime += amount;
    };

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

  it('should auto-Profile all fibers if the DevTools hook is detected', () => {
    const App = ({multiplier}) => {
      advanceTimeBy(2);
      return (
        <React.unstable_Profiler id="Profiler" onRender={onRender}>
          <AdvanceTime byAmount={3 * multiplier} shouldComponentUpdate={true} />
          <AdvanceTime
            byAmount={7 * multiplier}
            shouldComponentUpdate={false}
          />
        </React.unstable_Profiler>
      );
    };

    const onRender = jest.fn(() => {});
    const rendered = ReactTestRenderer.create(<App multiplier={1} />);

    expect(hook.onCommitFiberRoot).toHaveBeenCalledTimes(1);

    // Measure observable timing using the Profiler component.
    // The time spent in App (above the Profiler) won't be included in the durations,
    // But needs to be accounted for in the offset times.
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledWith(
      'Profiler',
      'mount',
      10,
      10,
      2,
      12,
      new Set(),
    );
    onRender.mockClear();

    // Measure unobservable timing required by the DevTools profiler.
    // At this point, the base time should include both:
    // The time 2ms in the App component itself, and
    // The 10ms spend in the Profiler sub-tree beneath.
    expect(rendered.root.findByType(App)._currentFiber().treeBaseDuration).toBe(
      12,
    );

    rendered.update(<App multiplier={2} />);

    // Measure observable timing using the Profiler component.
    // The time spent in App (above the Profiler) won't be included in the durations,
    // But needs to be accounted for in the offset times.
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledWith(
      'Profiler',
      'update',
      6,
      13,
      14,
      20,
      new Set(),
    );

    // Measure unobservable timing required by the DevTools profiler.
    // At this point, the base time should include both:
    // The initial 9ms for the components that do not re-render, and
    // The updated 6ms for the component that does.
    expect(rendered.root.findByType(App)._currentFiber().treeBaseDuration).toBe(
      15,
    );
  });

  it('should reset the fiber stack correctly after an error when profiling host roots', () => {
    advanceTimeBy(20);

    const rendered = ReactTestRenderer.create(
      <div>
        <AdvanceTime byAmount={2} />
      </div>,
    );

    advanceTimeBy(20);

    expect(() => {
      rendered.update(
        <div ref="this-will-cause-an-error">
          <AdvanceTime byAmount={3} />
        </div>,
      );
    }).toThrow();

    advanceTimeBy(20);

    // But this should render correctly, if the profiler's fiber stack has been reset.
    rendered.update(
      <div>
        <AdvanceTime byAmount={7} />
      </div>,
    );

    // Measure unobservable timing required by the DevTools profiler.
    // At this point, the base time should include only the most recent (not failed) render.
    // It should not include time spent on the initial render,
    // Or time that elapsed between any of the above renders.
    expect(
      rendered.root.findByType('div')._currentFiber().treeBaseDuration,
    ).toBe(7);
  });

  it('should store tracked interactions on the HostNode so DevTools can access them', () => {
    // Render without an interaction
    const rendered = ReactTestRenderer.create(<div />);

    const root = rendered.root._currentFiber().return;
    expect(root.stateNode.memoizedInteractions).toContainNoInteractions();

    advanceTimeBy(10);

    const eventTime = mockNow();

    // Render with an interaction
    InteractionTracking.track('some event', eventTime, () => {
      rendered.update(<div />);
    });

    expect(root.stateNode.memoizedInteractions).toMatchInteractions([
      {name: 'some event', timestamp: eventTime},
    ]);
  });
});
