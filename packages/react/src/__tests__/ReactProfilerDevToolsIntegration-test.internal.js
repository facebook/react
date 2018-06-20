/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactProfiler DevTools integration', () => {
  let React;
  let ReactFeatureFlags;
  let ReactTestRenderer;
  let AdvanceTime;
  let advanceTimeBy;
  let hook;
  let mockNow;

  const mockNowForTests = () => {
    let currentTime = 0;

    mockNow = jest.fn().mockImplementation(() => currentTime);

    ReactTestRenderer.unstable_setNowImplementation(mockNow);
    advanceTimeBy = amount => {
      currentTime += amount;
    };
  };

  beforeEach(() => {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook = {
      inject: () => {},
      onCommitFiberRoot: jest.fn((rendererId, root) => {}),
      onCommitFiberUnmount: () => {},
      supportsFiber: true,
    };

    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableProfilerTimer = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');

    mockNowForTests();

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
    expect(onRender).toHaveBeenCalledWith('Profiler', 'mount', 10, 10, 2, 12);
    onRender.mockClear();

    // Measure unobservable timing required by the DevTools profiler.
    // At this point, the base time should include both:
    // The time 2ms in the App component itself, and
    // The 10ms spend in the Profiler sub-tree beneath.
    expect(rendered.root.findByType(App)._currentFiber().treeBaseTime).toBe(12);

    rendered.update(<App multiplier={2} />);

    // Measure observable timing using the Profiler component.
    // The time spent in App (above the Profiler) won't be included in the durations,
    // But needs to be accounted for in the offset times.
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledWith('Profiler', 'update', 6, 13, 14, 20);

    // Measure unobservable timing required by the DevTools profiler.
    // At this point, the base time should include both:
    // The initial 9ms for the components that do not re-render, and
    // The updated 6ms for the component that does.
    expect(rendered.root.findByType(App)._currentFiber().treeBaseTime).toBe(15);
  });
});
