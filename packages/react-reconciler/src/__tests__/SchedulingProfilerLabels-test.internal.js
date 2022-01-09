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

  let act;
  let clearedMarks;
  let featureDetectionMarkName = null;
  let marks;

  global.IS_REACT_ACT_ENVIRONMENT = true;

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
  });

  afterEach(() => {
    // Verify all logged marks also get cleared.
    expect(marks).toHaveLength(0);

    delete global.performance;
  });

  it('regression test SyncLane', () => {
    ReactDOM.render(<div />, document.createElement('div'));

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(clearedMarks).toMatchInlineSnapshot(`
              Array [
                "__v3",
                "--schedule-render-1",
                "--render-start-1",
                "--render-stop",
                "--commit-start-1",
                "--react-version-17.0.3",
                "--profiler-version-1",
                "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
                "--layout-effects-start-1",
                "--layout-effects-stop",
                "--commit-stop",
              ]
          `);
    }
  });

  it('regression test DefaultLane', () => {
    if (gate(flags => flags.enableSchedulingProfiler)) {
      act(() => {
        const container = document.createElement('div');
        const root = ReactDOM.createRoot(container);

        root.render(<div />);
        expect(clearedMarks).toMatchInlineSnapshot(`
                  Array [
                    "__v3",
                    "--schedule-render-16",
                  ]
              `);
      });
    }
  });

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

    if (
      gate(
        flags => flags.enableSchedulingProfiler && !flags.enableLegacyFBSupport,
      )
    ) {
      act(() => {
        root.render(<App />);
      });

      clearedMarks.splice(0);

      act(() => {
        targetRef.current.click();
      });

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-state-update-1-App",
          "--render-start-1",
          "--component-render-start-App",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-1",
          "--react-version-17.0.3",
          "--profiler-version-1",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-1",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    }
  });

  it('regression test InputContinuousLane', () => {
    const targetRef = React.createRef(null);

    function App() {
      const [count, setCount] = React.useState(0);
      const handleMouseOver = () => setCount(count + 1);
      return <div ref={targetRef} onMouseOver={handleMouseOver} />;
    }

    if (gate(flags => flags.enableSchedulingProfiler)) {
      const container = document.createElement('div');
      const root = ReactDOM.createRoot(container);

      act(() => {
        root.render(<App />);
      });

      clearedMarks.splice(0);

      act(() => {
        const event = document.createEvent('MouseEvents');
        event.initEvent('mouseover', true, true);
        dispatchAndSetCurrentEvent(targetRef.current, event);
      });

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-state-update-4-App",
          "--render-start-4",
          "--component-render-start-App",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-4",
          "--react-version-17.0.3",
          "--profiler-version-1",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-4",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    }
  });
});
