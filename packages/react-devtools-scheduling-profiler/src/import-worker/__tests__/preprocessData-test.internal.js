/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import preprocessData, {
  getLanesFromTransportDecimalBitmask,
} from '../preprocessData';
import {REACT_TOTAL_NUM_LANES} from '../../constants';

describe(getLanesFromTransportDecimalBitmask, () => {
  it('should return array of lane numbers from bitmask string', () => {
    expect(getLanesFromTransportDecimalBitmask('1')).toEqual([0]);
    expect(getLanesFromTransportDecimalBitmask('512')).toEqual([9]);
    expect(getLanesFromTransportDecimalBitmask('3')).toEqual([0, 1]);
    expect(getLanesFromTransportDecimalBitmask('1234')).toEqual([
      1,
      4,
      6,
      7,
      10,
    ]); // 2 + 16 + 64 + 128 + 1024
    expect(
      getLanesFromTransportDecimalBitmask('1073741824'), // 0b1000000000000000000000000000000
    ).toEqual([30]);
    expect(
      getLanesFromTransportDecimalBitmask('2147483647'), // 0b1111111111111111111111111111111
    ).toEqual(Array.from(Array(31).keys()));
  });

  it('should return empty array if laneBitmaskString is not a bitmask', () => {
    expect(getLanesFromTransportDecimalBitmask('')).toEqual([]);
    expect(getLanesFromTransportDecimalBitmask('hello')).toEqual([]);
    expect(getLanesFromTransportDecimalBitmask('-1')).toEqual([]);
    expect(getLanesFromTransportDecimalBitmask('-0')).toEqual([]);
  });

  it('should ignore lanes outside REACT_TOTAL_NUM_LANES', () => {
    // Sanity check; this test may need to be updated when the no. of fiber
    // lanes are changed.
    expect(REACT_TOTAL_NUM_LANES).toBe(31);

    expect(
      getLanesFromTransportDecimalBitmask(
        '4294967297', // 2^32 + 1
      ),
    ).toEqual([0]);
  });
});

describe(preprocessData, () => {
  let React;
  let ReactDOM;

  let act;
  let clearedMarks;
  let featureDetectionMarkName = null;
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

  // These should be dynamic to mimic a real profile,
  // but reprooducible between test runs.
  let pid = 0;
  let tid = 0;
  let startTime = 0;

  function createUserTimingEntry(data) {
    return {
      pid: ++pid,
      tid: ++tid,
      ts: ++startTime,
      ...data,
    };
  }

  function createUserTimingData(sampleMarks) {
    const cpuProfilerSample = createUserTimingEntry({
      args: {data: {startTime: ++startTime}},
      cat: 'disabled-by-default-v8.cpu_profiler',
      id: '0x1',
      name: 'Profile',
      ph: 'P',
    });

    const randomSample = createUserTimingEntry({
      dur: 100,
      tdur: 200,
      ph: 'X',
      cat: 'disabled-by-default-devtools.timeline',
      name: 'RunTask',
      args: {},
    });

    const userTimingData = [cpuProfilerSample, randomSample];

    sampleMarks.forEach(markName => {
      userTimingData.push({
        pid: ++pid,
        tid: ++tid,
        ts: ++startTime,
        args: {data: {navigationId: 'fake-navigation-id'}},
        cat: 'blink.user_timing',
        name: markName,
        ph: 'R',
      });
    });

    return userTimingData;
  }

  beforeEach(() => {
    jest.resetModules();

    polyfillJSDomUserTiming();

    React = require('react');
    ReactDOM = require('react-dom');

    const TestUtils = require('react-dom/test-utils');
    act = TestUtils.act;

    tid = 0;
    pid = 0;
    startTime = 0;
  });

  afterEach(() => {
    // Verify all logged marks also get cleared.
    expect(marks).toHaveLength(0);

    delete global.performance;
  });

  it('should throw given an empty timeline', () => {
    expect(() => preprocessData([])).toThrow();
  });

  it('should throw given a timeline with no Profile event', () => {
    const randomSample = createUserTimingEntry({
      dur: 100,
      tdur: 200,
      ph: 'X',
      cat: 'disabled-by-default-devtools.timeline',
      name: 'RunTask',
      args: {},
    });

    expect(() => preprocessData([randomSample])).toThrow();
  });

  it('should return empty data given a timeline with no React scheduling profiling marks', () => {
    const cpuProfilerSample = createUserTimingEntry({
      args: {data: {startTime: ++startTime}},
      cat: 'disabled-by-default-v8.cpu_profiler',
      id: '0x1',
      name: 'Profile',
      ph: 'P',
    });

    const randomSample = createUserTimingEntry({
      dur: 100,
      tdur: 200,
      ph: 'X',
      cat: 'disabled-by-default-devtools.timeline',
      name: 'RunTask',
      args: {},
    });

    expect(preprocessData([cpuProfilerSample, randomSample])).toStrictEqual({
      duration: 0.002,
      events: [],
      flamechart: [],
      measures: [],
      otherUserTimingMarks: [],
      startTime: 1,
    });
  });

  // NOTE This test doesn't have to be gated because it has hard-coded profiler samples.
  it('should process legacy data format (before lane labels were added)', () => {
    const cpuProfilerSample = createUserTimingEntry({
      args: {data: {startTime: ++startTime}},
      cat: 'disabled-by-default-v8.cpu_profiler',
      id: '0x1',
      name: 'Profile',
      ph: 'P',
    });

    expect(
      // Data below is hard-coded based on an older profile sample.
      // Should be fine since this is explicitly a legacy-format test.
      preprocessData([
        cpuProfilerSample,
        createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--schedule-render-512-',
        }),
        createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--render-start-512',
        }),
        createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--render-stop',
        }),
        createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--commit-start-512',
        }),
        createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--layout-effects-start-512',
        }),
        createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--layout-effects-stop',
        }),
        createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--commit-stop',
        }),
      ]),
    ).toStrictEqual({
      duration: 0.008,
      events: [
        {
          componentStack: '',
          laneLabels: [],
          lanes: [9],
          timestamp: 0.002,
          type: 'schedule-render',
        },
      ],
      flamechart: [],
      measures: [
        {
          batchUID: 0,
          depth: 0,
          duration: 0.005,
          laneLabels: [],
          lanes: [9],
          timestamp: 0.003,
          type: 'render-idle',
        },
        {
          batchUID: 0,
          depth: 0,
          duration: 0.001,
          laneLabels: [],
          lanes: [9],
          timestamp: 0.003,
          type: 'render',
        },
        {
          batchUID: 0,
          depth: 0,
          duration: 0.003,
          laneLabels: [],
          lanes: [9],
          timestamp: 0.005,
          type: 'commit',
        },
        {
          batchUID: 0,
          depth: 1,
          duration: 0.001,
          laneLabels: [],
          lanes: [9],
          timestamp: 0.006,
          type: 'layout-effects',
        },
      ],
      otherUserTimingMarks: [],
      startTime: 1,
    });
  });

  // @gate enableSchedulingProfiler
  it('should process a sample legacy render sequence', () => {
    ReactDOM.render(<div />, document.createElement('div'));

    const reactVersion = require('shared/ReactVersion').default;

    const userTimingData = createUserTimingData(clearedMarks);
    expect(preprocessData(userTimingData)).toStrictEqual({
      duration: 0.011,
      events: [
        {
          componentStack: '',
          laneLabels: ['Sync'],
          lanes: [0],
          timestamp: 0.005,
          type: 'schedule-render',
        },
      ],
      flamechart: [],
      measures: [
        {
          batchUID: 0,
          depth: 0,
          duration: 0.004999999999999999,
          laneLabels: ['Sync'],
          lanes: [0],
          timestamp: 0.006,
          type: 'render-idle',
        },
        {
          batchUID: 0,
          depth: 0,
          duration: 0.001,
          laneLabels: ['Sync'],
          lanes: [0],
          timestamp: 0.006,
          type: 'render',
        },
        {
          batchUID: 0,
          depth: 0,
          duration: 0.002999999999999999,
          laneLabels: ['Sync'],
          lanes: [0],
          timestamp: 0.008,
          type: 'commit',
        },
        {
          batchUID: 0,
          depth: 1,
          duration: 0.0010000000000000009,
          laneLabels: ['Sync'],
          lanes: [0],
          timestamp: 0.009,
          type: 'layout-effects',
        },
      ],
      otherUserTimingMarks: [
        {
          name: '__v3',
          timestamp: 0.003,
        },
        {
          name: `--react-init-${reactVersion}`,
          timestamp: 0.004,
        },
      ],
      startTime: 1,
    });
  });

  // @gate enableSchedulingProfiler
  it('should process a sample createRoot render sequence', () => {
    function App() {
      const [didMount, setDidMount] = React.useState(false);
      React.useEffect(() => {
        if (!didMount) {
          setDidMount(true);
        }
      });
      return true;
    }

    const root = ReactDOM.createRoot(document.createElement('div'));
    act(() => root.render(<App />));

    const userTimingData = createUserTimingData(clearedMarks);
    expect(preprocessData(userTimingData)).toStrictEqual({
      duration: 0.022,
      events: [
        {
          componentStack: '',
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.005,
          type: 'schedule-render',
        },
        {
          componentName: 'App',
          componentStack: '',
          isCascading: false,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.013,
          type: 'schedule-state-update',
        },
      ],
      flamechart: [],
      measures: [
        {
          batchUID: 0,
          depth: 0,
          duration: 0.004999999999999999,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.006,
          type: 'render-idle',
        },
        {
          batchUID: 0,
          depth: 0,
          duration: 0.001,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.006,
          type: 'render',
        },
        {
          batchUID: 0,
          depth: 0,
          duration: 0.002999999999999999,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.008,
          type: 'commit',
        },
        {
          batchUID: 0,
          depth: 1,
          duration: 0.0010000000000000009,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.009,
          type: 'layout-effects',
        },
        {
          batchUID: 0,
          depth: 0,
          duration: 0.002,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.012,
          type: 'passive-effects',
        },
        {
          batchUID: 1,
          depth: 0,
          duration: 0.005000000000000001,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.015,
          type: 'render-idle',
        },
        {
          batchUID: 1,
          depth: 0,
          duration: 0.0010000000000000009,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.015,
          type: 'render',
        },
        {
          batchUID: 1,
          depth: 0,
          duration: 0.002999999999999999,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.017,
          type: 'commit',
        },
        {
          batchUID: 1,
          depth: 1,
          duration: 0.0010000000000000009,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.018,
          type: 'layout-effects',
        },
        {
          batchUID: 1,
          depth: 0,
          duration: 0.0009999999999999974,
          laneLabels: ['Default'],
          lanes: [4],
          timestamp: 0.021,
          type: 'passive-effects',
        },
      ],
      otherUserTimingMarks: [
        {
          name: '__v3',
          timestamp: 0.003,
        },
        {
          name: '--react-init-17.0.3',
          timestamp: 0.004,
        },
      ],
      startTime: 1,
    });
  });

  // @gate enableSchedulingProfiler
  it('should error if events and measures are incomplete', () => {
    const container = document.createElement('div');
    ReactDOM.render(<div />, container);

    const invalidMarks = clearedMarks.filter(
      mark => !mark.includes('render-stop'),
    );
    const invalidUserTimingData = createUserTimingData(invalidMarks);

    const error = spyOnDevAndProd(console, 'error');
    preprocessData(invalidUserTimingData);
    expect(error).toHaveBeenCalled();
  });

  // @gate enableSchedulingProfiler
  it('should error if work is completed without being started', () => {
    const container = document.createElement('div');
    ReactDOM.render(<div />, container);

    const invalidMarks = clearedMarks.filter(
      mark => !mark.includes('render-start'),
    );
    const invalidUserTimingData = createUserTimingData(invalidMarks);

    const error = spyOnDevAndProd(console, 'error');
    preprocessData(invalidUserTimingData);
    expect(error).toHaveBeenCalled();
  });

  it('should populate other user timing marks', () => {
    const userTimingData = createUserTimingData([]);
    userTimingData.push(
      createUserTimingEntry({
        args: {},
        cat: 'blink.user_timing',
        id: '0xcdf75f7c',
        name: 'VCWithoutImage: root',
        ph: 'n',
        scope: 'blink.user_timing',
      }),
    );
    userTimingData.push(
      createUserTimingEntry({
        cat: 'blink.user_timing',
        name: '--a-mark-that-looks-like-one-of-ours',
        ph: 'R',
      }),
    );
    userTimingData.push(
      createUserTimingEntry({
        cat: 'blink.user_timing',
        name: 'Some other mark',
        ph: 'R',
      }),
    );

    expect(preprocessData(userTimingData).otherUserTimingMarks).toStrictEqual([
      {
        name: 'VCWithoutImage: root',
        timestamp: 0.003,
      },
      {
        name: '--a-mark-that-looks-like-one-of-ours',
        timestamp: 0.004,
      },
      {
        name: 'Some other mark',
        timestamp: 0.005,
      },
    ]);
  });

  // TODO: Add test for flamechart parsing
});
