/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// This test schedules work for as many lanes as we can (easily) using public APIs.
// It will hopefully serve as a reminder to update getLabelsForLanes() when we update Lanes.
// It's okay to delete any individual test in this file if the public API changes.
describe('SchedulingProfiler labels', () => {
  let React;
  let ReactDOM;
  let ReactFiberLane;

  let act;
  let clearedMarks;
  let featureDetectionMarkName = null;
  let formatLanes;
  let marks;

  function polyfillJSDomUserTiming() {
    featureDetectionMarkName = null;

    clearedMarks = [];
    marks = [];

    // This is not a true polyfill, but it gives us enough to capture marks.
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API

    // JSDom already implements global.performance and it can't be overridden.
    // However it only supports now() and timeOrigin() so we need to "upgrade it" in place.

    if (!global.performance) {
      global.performance = {};
    }

    global.performance.clearMarks = function clearMarks(markName) {
      clearedMarks.push(markName);
      marks = marks.filter(mark => mark !== markName);
    };

    global.performance.mark = function mark(markName, markOptions) {
      if (featureDetectionMarkName === null) {
        featureDetectionMarkName = markName;
      }
      marks.push(markName);
      if (markOptions != null) {
        // This is triggers the feature detection.
        markOptions.startTime++;
      }
    };
  }

  function dispatchAndSetCurrentEvent(element, event) {
    try {
      window.event = event;
      element.dispatchEvent(event);
    } finally {
      window.event = undefined;
    }
  }

  beforeEach(() => {
    jest.resetModules();

    polyfillJSDomUserTiming();

    React = require('react');
    ReactDOM = require('react-dom');

    const TestUtils = require('react-dom/test-utils');
    act = TestUtils.act;

    const SchedulingProfiler = require('react-reconciler/src/SchedulingProfiler');
    formatLanes = SchedulingProfiler.formatLanes;

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFiberLane = ReactFeatureFlags.enableNewReconciler
      ? require('react-reconciler/src/ReactFiberLane.new')
      : require('react-reconciler/src/ReactFiberLane.old');
  });

  afterEach(() => {
    // Verify all logged marks also get cleared.
    expect(marks).toHaveLength(0);

    delete global.performance;
  });

  // @gate enableSchedulingProfiler
  it('regression test SyncLane', () => {
    ReactDOM.render(<div />, document.createElement('div'));
    expect(clearedMarks).toContain(
      `--schedule-render-${formatLanes(ReactFiberLane.SyncLane)}`,
    );
  });

  // @gate enableSchedulingProfiler
  it('regression test DefaultLane', () => {
    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);

    act(() => {
      root.render(<div />);
      expect(clearedMarks).toContain(
        `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
      );
    });
  });

  // @gate enableSchedulingProfiler
  // @gate !enableLegacyFBSupport
  it('regression test InputDiscreteLane', () => {
    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    const targetRef = React.createRef(null);

    function App() {
      const [count, setCount] = React.useState(0);
      const handleClick = () => {
        setCount(count + 1);
      };
      return <button ref={targetRef} onClick={handleClick} />;
    }

    act(() => {
      root.render(<App />);
    });

    clearedMarks.splice(0);

    act(() => {
      targetRef.current.click();
    });
    expect(clearedMarks).toContain(
      `--schedule-state-update-${formatLanes(ReactFiberLane.SyncLane)}-App`,
    );
  });

  // @gate enableSchedulingProfiler
  it('regression test InputContinuousLane', () => {
    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    const targetRef = React.createRef(null);

    function App() {
      const [count, setCount] = React.useState(0);
      const handleMouseOver = () => setCount(count + 1);
      return <div ref={targetRef} onMouseOver={handleMouseOver} />;
    }

    act(() => {
      root.render(<App />);
    });

    clearedMarks.splice(0);

    act(() => {
      const event = document.createEvent('MouseEvents');
      event.initEvent('mouseover', true, true);
      dispatchAndSetCurrentEvent(targetRef.current, event);
    });
    expect(clearedMarks).toContain(
      `--schedule-state-update-${formatLanes(
        ReactFiberLane.InputContinuousLane,
      )}-App`,
    );
  });
});
