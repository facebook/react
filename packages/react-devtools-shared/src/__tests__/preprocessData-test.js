/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

describe('Timeline profiler', () => {
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let Scheduler;
  let utils;

  describe('User Timing API', () => {
    let clearedMarks;
    let featureDetectionMarkName = null;
    let marks;
    let setPerformanceMock;

    function createUserTimingPolyfill() {
      featureDetectionMarkName = null;

      clearedMarks = [];
      marks = [];

      // Remove file-system specific bits or version-specific bits of information from the module range marks.
      function filterMarkData(markName) {
        if (markName.startsWith('--react-internal-module-start')) {
          return '--react-internal-module-start-  at filtered (<anonymous>:0:0)';
        } else if (markName.startsWith('--react-internal-module-stop')) {
          return '--react-internal-module-stop-  at filtered (<anonymous>:1:1)';
        } else if (markName.startsWith('--react-version')) {
          return '--react-version-<filtered-version>';
        } else {
          return markName;
        }
      }

      // This is not a true polyfill, but it gives us enough to capture marks.
      // Reference: https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
      return {
        clearMarks(markName) {
          markName = filterMarkData(markName);

          clearedMarks.push(markName);
          marks = marks.filter(mark => mark !== markName);
        },
        mark(markName, markOptions) {
          markName = filterMarkData(markName);

          if (featureDetectionMarkName === null) {
            featureDetectionMarkName = markName;
          }

          marks.push(markName);

          if (markOptions != null) {
            // This is triggers the feature detection.
            markOptions.startTime++;
          }
        },
      };
    }

    function clearPendingMarks() {
      clearedMarks.splice(0);
    }

    beforeEach(() => {
      utils = require('./utils');
      utils.beforeEachProfiling();

      React = require('react');
      ReactDOM = require('react-dom');
      ReactDOMClient = require('react-dom/client');
      Scheduler = require('scheduler');

      setPerformanceMock = require('react-devtools-shared/src/backend/profilingHooks')
        .setPerformanceMock_ONLY_FOR_TESTING;
      setPerformanceMock(createUserTimingPolyfill());

      const store = global.store;

      // Start profiling so that data will actually be recorded.
      utils.act(() => store.profilerStore.startProfiling());

      global.IS_REACT_ACT_ENVIRONMENT = true;
    });

    afterEach(() => {
      // Verify all logged marks also get cleared.
      expect(marks).toHaveLength(0);

      setPerformanceMock(null);
    });

    describe('getLanesFromTransportDecimalBitmask', () => {
      let getLanesFromTransportDecimalBitmask;

      beforeEach(() => {
        getLanesFromTransportDecimalBitmask = require('react-devtools-timeline/src/import-worker/preprocessData')
          .getLanesFromTransportDecimalBitmask;
      });

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
        const REACT_TOTAL_NUM_LANES = require('react-devtools-timeline/src/constants')
          .REACT_TOTAL_NUM_LANES;

        // Sanity check; this test may need to be updated when the no. of fiber lanes are changed.
        expect(REACT_TOTAL_NUM_LANES).toBe(31);

        expect(
          getLanesFromTransportDecimalBitmask(
            '4294967297', // 2^32 + 1
          ),
        ).toEqual([0]);
      });
    });

    describe('preprocessData', () => {
      let preprocessData;

      beforeEach(() => {
        preprocessData = require('react-devtools-timeline/src/import-worker/preprocessData')
          .default;
      });

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

      function createProfilerVersionEntry() {
        const SCHEDULING_PROFILER_VERSION = require('react-devtools-timeline/src/constants')
          .SCHEDULING_PROFILER_VERSION;
        return createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--profiler-version-' + SCHEDULING_PROFILER_VERSION,
        });
      }

      function createReactVersionEntry() {
        return createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--react-version-<filtered-version>',
        });
      }

      function createLaneLabelsEntry() {
        return createUserTimingEntry({
          cat: 'blink.user_timing',
          name:
            '--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen',
        });
      }

      function createNativeEventEntry(type, duration) {
        return createUserTimingEntry({
          cat: 'devtools.timeline',
          name: 'EventDispatch',
          args: {data: {type}},
          dur: duration,
          tdur: duration,
        });
      }

      function creactCpuProfilerSample() {
        return createUserTimingEntry({
          args: {data: {startTime: ++startTime}},
          cat: 'disabled-by-default-v8.cpu_profiler',
          id: '0x1',
          name: 'Profile',
          ph: 'P',
        });
      }

      function createBoilerplateEntries() {
        return [
          createProfilerVersionEntry(),
          createReactVersionEntry(),
          createLaneLabelsEntry(),
        ];
      }

      function createUserTimingData(sampleMarks) {
        const cpuProfilerSample = creactCpuProfilerSample();

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
            args: {data: {}},
            cat: 'blink.user_timing',
            name: markName,
            ph: 'R',
          });
        });

        return userTimingData;
      }

      beforeEach(() => {
        tid = 0;
        pid = 0;
        startTime = 0;
      });

      it('should throw given an empty timeline', async () => {
        await expect(async () => preprocessData([])).rejects.toThrow();
      });

      it('should throw given a timeline with no Profile event', async () => {
        const randomSample = createUserTimingEntry({
          dur: 100,
          tdur: 200,
          ph: 'X',
          cat: 'disabled-by-default-devtools.timeline',
          name: 'RunTask',
          args: {},
        });

        await expect(async () =>
          preprocessData([randomSample]),
        ).rejects.toThrow();
      });

      it('should throw given a timeline without an explicit profiler version mark nor any other React marks', async () => {
        const cpuProfilerSample = creactCpuProfilerSample();

        await expect(
          async () => await preprocessData([cpuProfilerSample]),
        ).rejects.toThrow(
          'Please provide profiling data from an React application',
        );
      });

      it('should throw given a timeline with React scheduling marks, but without an explicit profiler version mark', async () => {
        const cpuProfilerSample = creactCpuProfilerSample();
        const scheduleRenderSample = createUserTimingEntry({
          cat: 'blink.user_timing',
          name: '--schedule-render-512-',
        });
        const samples = [cpuProfilerSample, scheduleRenderSample];

        await expect(async () => await preprocessData(samples)).rejects.toThrow(
          'This version of profiling data is not supported',
        );
      });

      it('should return empty data given a timeline with no React scheduling profiling marks', async () => {
        const cpuProfilerSample = creactCpuProfilerSample();
        const randomSample = createUserTimingEntry({
          dur: 100,
          tdur: 200,
          ph: 'X',
          cat: 'disabled-by-default-devtools.timeline',
          name: 'RunTask',
          args: {},
        });

        const data = await preprocessData([
          ...createBoilerplateEntries(),
          cpuProfilerSample,
          randomSample,
        ]);
        expect(data).toMatchInlineSnapshot(`
                Object {
                  "batchUIDToMeasuresMap": Map {},
                  "componentMeasures": Array [],
                  "duration": 0.005,
                  "flamechart": Array [],
                  "internalModuleSourceToRanges": Map {},
                  "laneToLabelMap": Map {
                    0 => "Sync",
                    1 => "InputContinuousHydration",
                    2 => "InputContinuous",
                    3 => "DefaultHydration",
                    4 => "Default",
                    5 => "TransitionHydration",
                    6 => "Transition",
                    7 => "Transition",
                    8 => "Transition",
                    9 => "Transition",
                    10 => "Transition",
                    11 => "Transition",
                    12 => "Transition",
                    13 => "Transition",
                    14 => "Transition",
                    15 => "Transition",
                    16 => "Transition",
                    17 => "Transition",
                    18 => "Transition",
                    19 => "Transition",
                    20 => "Transition",
                    21 => "Transition",
                    22 => "Retry",
                    23 => "Retry",
                    24 => "Retry",
                    25 => "Retry",
                    26 => "Retry",
                    27 => "SelectiveHydration",
                    28 => "IdleHydration",
                    29 => "Idle",
                    30 => "Offscreen",
                  },
                  "laneToReactMeasureMap": Map {
                    0 => Array [],
                    1 => Array [],
                    2 => Array [],
                    3 => Array [],
                    4 => Array [],
                    5 => Array [],
                    6 => Array [],
                    7 => Array [],
                    8 => Array [],
                    9 => Array [],
                    10 => Array [],
                    11 => Array [],
                    12 => Array [],
                    13 => Array [],
                    14 => Array [],
                    15 => Array [],
                    16 => Array [],
                    17 => Array [],
                    18 => Array [],
                    19 => Array [],
                    20 => Array [],
                    21 => Array [],
                    22 => Array [],
                    23 => Array [],
                    24 => Array [],
                    25 => Array [],
                    26 => Array [],
                    27 => Array [],
                    28 => Array [],
                    29 => Array [],
                    30 => Array [],
                  },
                  "nativeEvents": Array [],
                  "networkMeasures": Array [],
                  "otherUserTimingMarks": Array [],
                  "reactVersion": "<filtered-version>",
                  "schedulingEvents": Array [],
                  "snapshotHeight": 0,
                  "snapshots": Array [],
                  "startTime": 1,
                  "suspenseEvents": Array [],
                  "thrownErrors": Array [],
                }
          `);
      });

      it('should process legacy data format (before lane labels were added)', async () => {
        const cpuProfilerSample = creactCpuProfilerSample();

        // Data below is hard-coded based on an older profile sample.
        // Should be fine since this is explicitly a legacy-format test.
        const data = await preprocessData([
          ...createBoilerplateEntries(),
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
        ]);
        expect(data).toMatchInlineSnapshot(`
          Object {
            "batchUIDToMeasuresMap": Map {
              0 => Array [
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.005,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.006,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.006,
                  "type": "render",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.008,
                  "type": "commit",
                },
                Object {
                  "batchUID": 0,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.009,
                  "type": "layout-effects",
                },
              ],
            },
            "componentMeasures": Array [],
            "duration": 0.011,
            "flamechart": Array [],
            "internalModuleSourceToRanges": Map {},
            "laneToLabelMap": Map {
              0 => "Sync",
              1 => "InputContinuousHydration",
              2 => "InputContinuous",
              3 => "DefaultHydration",
              4 => "Default",
              5 => "TransitionHydration",
              6 => "Transition",
              7 => "Transition",
              8 => "Transition",
              9 => "Transition",
              10 => "Transition",
              11 => "Transition",
              12 => "Transition",
              13 => "Transition",
              14 => "Transition",
              15 => "Transition",
              16 => "Transition",
              17 => "Transition",
              18 => "Transition",
              19 => "Transition",
              20 => "Transition",
              21 => "Transition",
              22 => "Retry",
              23 => "Retry",
              24 => "Retry",
              25 => "Retry",
              26 => "Retry",
              27 => "SelectiveHydration",
              28 => "IdleHydration",
              29 => "Idle",
              30 => "Offscreen",
            },
            "laneToReactMeasureMap": Map {
              0 => Array [],
              1 => Array [],
              2 => Array [],
              3 => Array [],
              4 => Array [],
              5 => Array [],
              6 => Array [],
              7 => Array [],
              8 => Array [],
              9 => Array [
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.005,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.006,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.006,
                  "type": "render",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.008,
                  "type": "commit",
                },
                Object {
                  "batchUID": 0,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000001001",
                  "timestamp": 0.009,
                  "type": "layout-effects",
                },
              ],
              10 => Array [],
              11 => Array [],
              12 => Array [],
              13 => Array [],
              14 => Array [],
              15 => Array [],
              16 => Array [],
              17 => Array [],
              18 => Array [],
              19 => Array [],
              20 => Array [],
              21 => Array [],
              22 => Array [],
              23 => Array [],
              24 => Array [],
              25 => Array [],
              26 => Array [],
              27 => Array [],
              28 => Array [],
              29 => Array [],
              30 => Array [],
            },
            "nativeEvents": Array [],
            "networkMeasures": Array [],
            "otherUserTimingMarks": Array [],
            "reactVersion": "<filtered-version>",
            "schedulingEvents": Array [
              Object {
                "lanes": "0b0000000000000000000000000001001",
                "timestamp": 0.005,
                "type": "schedule-render",
                "warning": null,
              },
            ],
            "snapshotHeight": 0,
            "snapshots": Array [],
            "startTime": 1,
            "suspenseEvents": Array [],
            "thrownErrors": Array [],
          }
        `);
      });

      it('should process a sample legacy render sequence', async () => {
        utils.legacyRender(<div />, document.createElement('div'));

        const data = await preprocessData([
          ...createBoilerplateEntries(),
          ...createUserTimingData(clearedMarks),
        ]);
        expect(data).toMatchInlineSnapshot(`
          Object {
            "batchUIDToMeasuresMap": Map {
              0 => Array [
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.01,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.006,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.006,
                  "type": "render",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.008,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.008,
                  "type": "commit",
                },
                Object {
                  "batchUID": 0,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.014,
                  "type": "layout-effects",
                },
              ],
            },
            "componentMeasures": Array [],
            "duration": 0.016,
            "flamechart": Array [],
            "internalModuleSourceToRanges": Map {
              undefined => Array [
                Array [
                  Object {
                    "columnNumber": 0,
                    "functionName": "filtered",
                    "lineNumber": 0,
                    "source": "  at filtered (<anonymous>:0:0)",
                  },
                  Object {
                    "columnNumber": 1,
                    "functionName": "filtered",
                    "lineNumber": 1,
                    "source": "  at filtered (<anonymous>:1:1)",
                  },
                ],
              ],
            },
            "laneToLabelMap": Map {
              0 => "Sync",
              1 => "InputContinuousHydration",
              2 => "InputContinuous",
              3 => "DefaultHydration",
              4 => "Default",
              5 => "TransitionHydration",
              6 => "Transition",
              7 => "Transition",
              8 => "Transition",
              9 => "Transition",
              10 => "Transition",
              11 => "Transition",
              12 => "Transition",
              13 => "Transition",
              14 => "Transition",
              15 => "Transition",
              16 => "Transition",
              17 => "Transition",
              18 => "Transition",
              19 => "Transition",
              20 => "Transition",
              21 => "Transition",
              22 => "Retry",
              23 => "Retry",
              24 => "Retry",
              25 => "Retry",
              26 => "Retry",
              27 => "SelectiveHydration",
              28 => "IdleHydration",
              29 => "Idle",
              30 => "Offscreen",
            },
            "laneToReactMeasureMap": Map {
              0 => Array [
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.01,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.006,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.006,
                  "type": "render",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.008,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.008,
                  "type": "commit",
                },
                Object {
                  "batchUID": 0,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000000",
                  "timestamp": 0.014,
                  "type": "layout-effects",
                },
              ],
              1 => Array [],
              2 => Array [],
              3 => Array [],
              4 => Array [],
              5 => Array [],
              6 => Array [],
              7 => Array [],
              8 => Array [],
              9 => Array [],
              10 => Array [],
              11 => Array [],
              12 => Array [],
              13 => Array [],
              14 => Array [],
              15 => Array [],
              16 => Array [],
              17 => Array [],
              18 => Array [],
              19 => Array [],
              20 => Array [],
              21 => Array [],
              22 => Array [],
              23 => Array [],
              24 => Array [],
              25 => Array [],
              26 => Array [],
              27 => Array [],
              28 => Array [],
              29 => Array [],
              30 => Array [],
            },
            "nativeEvents": Array [],
            "networkMeasures": Array [],
            "otherUserTimingMarks": Array [],
            "reactVersion": "<filtered-version>",
            "schedulingEvents": Array [
              Object {
                "lanes": "0b0000000000000000000000000000000",
                "timestamp": 0.005,
                "type": "schedule-render",
                "warning": null,
              },
            ],
            "snapshotHeight": 0,
            "snapshots": Array [],
            "startTime": 4,
            "suspenseEvents": Array [],
            "thrownErrors": Array [],
          }
        `);
      });

      it('should process a sample createRoot render sequence', async () => {
        function App() {
          const [didMount, setDidMount] = React.useState(false);
          React.useEffect(() => {
            if (!didMount) {
              setDidMount(true);
            }
          });
          return true;
        }

        const root = ReactDOMClient.createRoot(document.createElement('div'));
        utils.act(() => root.render(<App />));

        const data = await preprocessData([
          ...createBoilerplateEntries(),
          ...createUserTimingData(clearedMarks),
        ]);
        expect(data).toMatchInlineSnapshot(`
          Object {
            "batchUIDToMeasuresMap": Map {
              0 => Array [
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.012,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.006,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.006,
                  "type": "render",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.008,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.01,
                  "type": "commit",
                },
                Object {
                  "batchUID": 0,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.016,
                  "type": "layout-effects",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.004,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.019,
                  "type": "passive-effects",
                },
              ],
              1 => Array [
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.012,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.024,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.024,
                  "type": "render",
                },
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.008,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.028,
                  "type": "commit",
                },
                Object {
                  "batchUID": 1,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.034,
                  "type": "layout-effects",
                },
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.037,
                  "type": "passive-effects",
                },
              ],
            },
            "componentMeasures": Array [
              Object {
                "componentName": "App",
                "duration": 0.001,
                "timestamp": 0.007,
                "type": "render",
                "warning": null,
              },
              Object {
                "componentName": "App",
                "duration": 0.002,
                "timestamp": 0.02,
                "type": "passive-effect-mount",
                "warning": null,
              },
              Object {
                "componentName": "App",
                "duration": 0.001,
                "timestamp": 0.025,
                "type": "render",
                "warning": null,
              },
              Object {
                "componentName": "App",
                "duration": 0.001,
                "timestamp": 0.038,
                "type": "passive-effect-mount",
                "warning": null,
              },
            ],
            "duration": 0.04,
            "flamechart": Array [],
            "internalModuleSourceToRanges": Map {
              undefined => Array [
                Array [
                  Object {
                    "columnNumber": 0,
                    "functionName": "filtered",
                    "lineNumber": 0,
                    "source": "  at filtered (<anonymous>:0:0)",
                  },
                  Object {
                    "columnNumber": 1,
                    "functionName": "filtered",
                    "lineNumber": 1,
                    "source": "  at filtered (<anonymous>:1:1)",
                  },
                ],
              ],
            },
            "laneToLabelMap": Map {
              0 => "Sync",
              1 => "InputContinuousHydration",
              2 => "InputContinuous",
              3 => "DefaultHydration",
              4 => "Default",
              5 => "TransitionHydration",
              6 => "Transition",
              7 => "Transition",
              8 => "Transition",
              9 => "Transition",
              10 => "Transition",
              11 => "Transition",
              12 => "Transition",
              13 => "Transition",
              14 => "Transition",
              15 => "Transition",
              16 => "Transition",
              17 => "Transition",
              18 => "Transition",
              19 => "Transition",
              20 => "Transition",
              21 => "Transition",
              22 => "Retry",
              23 => "Retry",
              24 => "Retry",
              25 => "Retry",
              26 => "Retry",
              27 => "SelectiveHydration",
              28 => "IdleHydration",
              29 => "Idle",
              30 => "Offscreen",
            },
            "laneToReactMeasureMap": Map {
              0 => Array [],
              1 => Array [],
              2 => Array [],
              3 => Array [],
              4 => Array [
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.012,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.006,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.006,
                  "type": "render",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.008,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.01,
                  "type": "commit",
                },
                Object {
                  "batchUID": 0,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.016,
                  "type": "layout-effects",
                },
                Object {
                  "batchUID": 0,
                  "depth": 0,
                  "duration": 0.004,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.019,
                  "type": "passive-effects",
                },
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.012,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.024,
                  "type": "render-idle",
                },
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.024,
                  "type": "render",
                },
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.008,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.028,
                  "type": "commit",
                },
                Object {
                  "batchUID": 1,
                  "depth": 1,
                  "duration": 0.001,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.034,
                  "type": "layout-effects",
                },
                Object {
                  "batchUID": 1,
                  "depth": 0,
                  "duration": 0.003,
                  "lanes": "0b0000000000000000000000000000100",
                  "timestamp": 0.037,
                  "type": "passive-effects",
                },
              ],
              5 => Array [],
              6 => Array [],
              7 => Array [],
              8 => Array [],
              9 => Array [],
              10 => Array [],
              11 => Array [],
              12 => Array [],
              13 => Array [],
              14 => Array [],
              15 => Array [],
              16 => Array [],
              17 => Array [],
              18 => Array [],
              19 => Array [],
              20 => Array [],
              21 => Array [],
              22 => Array [],
              23 => Array [],
              24 => Array [],
              25 => Array [],
              26 => Array [],
              27 => Array [],
              28 => Array [],
              29 => Array [],
              30 => Array [],
            },
            "nativeEvents": Array [],
            "networkMeasures": Array [],
            "otherUserTimingMarks": Array [],
            "reactVersion": "<filtered-version>",
            "schedulingEvents": Array [
              Object {
                "lanes": "0b0000000000000000000000000000100",
                "timestamp": 0.005,
                "type": "schedule-render",
                "warning": null,
              },
              Object {
                "componentName": "App",
                "lanes": "0b0000000000000000000000000000100",
                "timestamp": 0.021,
                "type": "schedule-state-update",
                "warning": null,
              },
            ],
            "snapshotHeight": 0,
            "snapshots": Array [],
            "startTime": 4,
            "suspenseEvents": Array [],
            "thrownErrors": Array [],
          }
        `);
      });

      it('should error if events and measures are incomplete', async () => {
        const container = document.createElement('div');
        utils.legacyRender(<div />, container);

        const invalidMarks = clearedMarks.filter(
          mark => !mark.includes('render-stop'),
        );
        const invalidUserTimingData = createUserTimingData(invalidMarks);

        const error = spyOn(console, 'error');
        preprocessData([
          ...createBoilerplateEntries(),
          ...invalidUserTimingData,
        ]);
        expect(error).toHaveBeenCalled();
      });

      it('should error if work is completed without being started', async () => {
        const container = document.createElement('div');
        utils.legacyRender(<div />, container);

        const invalidMarks = clearedMarks.filter(
          mark => !mark.includes('render-start'),
        );
        const invalidUserTimingData = createUserTimingData(invalidMarks);

        const error = spyOn(console, 'error');
        preprocessData([
          ...createBoilerplateEntries(),
          ...invalidUserTimingData,
        ]);
        expect(error).toHaveBeenCalled();
      });

      it('should populate other user timing marks', async () => {
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

        const data = await preprocessData([
          ...createBoilerplateEntries(),
          ...userTimingData,
        ]);
        expect(data.otherUserTimingMarks).toMatchInlineSnapshot(`
                Array [
                  Object {
                    "name": "VCWithoutImage: root",
                    "timestamp": 0.003,
                  },
                  Object {
                    "name": "--a-mark-that-looks-like-one-of-ours",
                    "timestamp": 0.004,
                  },
                  Object {
                    "name": "Some other mark",
                    "timestamp": 0.005,
                  },
                ]
          `);
      });

      it('should include a suspended resource "displayName" if one is set', async () => {
        let promise = null;
        let resolvedValue = null;
        function readValue(value) {
          if (resolvedValue !== null) {
            return resolvedValue;
          } else if (promise === null) {
            promise = Promise.resolve(true).then(() => {
              resolvedValue = value;
            });
            promise.displayName = 'Testing displayName';
          }
          throw promise;
        }

        function Component() {
          const value = readValue(123);
          return value;
        }

        const testMarks = [creactCpuProfilerSample()];

        const root = ReactDOMClient.createRoot(document.createElement('div'));
        utils.act(() =>
          root.render(
            <React.Suspense fallback="Loading...">
              <Component />
            </React.Suspense>,
          ),
        );

        testMarks.push(...createUserTimingData(clearedMarks));

        let data;
        await utils.actAsync(async () => {
          data = await preprocessData(testMarks);
        });
        expect(data.suspenseEvents).toHaveLength(1);
        expect(data.suspenseEvents[0].promiseName).toBe('Testing displayName');
      });

      describe('warnings', () => {
        describe('long event handlers', () => {
          it('should not warn when React scedules a (sync) update inside of a short event handler', async () => {
            function App() {
              return null;
            }

            const testMarks = [
              creactCpuProfilerSample(),
              ...createBoilerplateEntries(),
              createNativeEventEntry('click', 5),
            ];

            clearPendingMarks();

            utils.legacyRender(<App />, document.createElement('div'));

            testMarks.push(...createUserTimingData(clearedMarks));

            const data = await preprocessData(testMarks);
            const event = data.nativeEvents.find(({type}) => type === 'click');
            expect(event.warning).toBe(null);
          });

          it('should not warn about long events if the cause was non-React JavaScript', async () => {
            function App() {
              return null;
            }

            const testMarks = [
              creactCpuProfilerSample(),
              ...createBoilerplateEntries(),
              createNativeEventEntry('click', 25000),
            ];

            startTime += 2000;

            clearPendingMarks();

            utils.legacyRender(<App />, document.createElement('div'));

            testMarks.push(...createUserTimingData(clearedMarks));

            const data = await preprocessData(testMarks);
            const event = data.nativeEvents.find(({type}) => type === 'click');
            expect(event.warning).toBe(null);
          });

          it('should warn when React scedules a long (sync) update inside of an event', async () => {
            function App() {
              return null;
            }

            const testMarks = [
              creactCpuProfilerSample(),
              ...createBoilerplateEntries(),
              createNativeEventEntry('click', 25000),
            ];

            clearPendingMarks();

            utils.legacyRender(<App />, document.createElement('div'));

            clearedMarks.forEach(markName => {
              if (markName === '--render-stop') {
                // Fake a long running render
                startTime += 20000;
              }

              testMarks.push({
                pid: ++pid,
                tid: ++tid,
                ts: ++startTime,
                args: {data: {}},
                cat: 'blink.user_timing',
                name: markName,
                ph: 'R',
              });
            });

            const data = await preprocessData(testMarks);
            const event = data.nativeEvents.find(({type}) => type === 'click');
            expect(event.warning).toMatchInlineSnapshot(
              `"An event handler scheduled a big update with React. Consider using the Transition API to defer some of this work."`,
            );
          });

          it('should not warn when React finishes a previously long (async) update with a short (sync) update inside of an event', async () => {
            function Yield({id, value}) {
              Scheduler.unstable_yieldValue(`${id}:${value}`);
              return null;
            }

            const testMarks = [
              creactCpuProfilerSample(),
              ...createBoilerplateEntries(),
            ];

            // Advance the clock by some arbitrary amount.
            startTime += 50000;

            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );

            // Temporarily turn off the act environment, since we're intentionally using Scheduler instead.
            global.IS_REACT_ACT_ENVIRONMENT = false;
            React.startTransition(() => {
              // Start rendering an async update (but don't finish).
              root.render(
                <>
                  <Yield id="A" value={1} />
                  <Yield id="B" value={1} />
                </>,
              );
              expect(Scheduler).toFlushAndYieldThrough(['A:1']);

              testMarks.push(...createUserTimingData(clearedMarks));
              clearPendingMarks();

              // Advance the clock some more to make the pending React update seem long.
              startTime += 20000;

              // Fake a long "click" event in the middle
              // and schedule a sync update that will also flush the previous work.
              testMarks.push(createNativeEventEntry('click', 25000));
              ReactDOM.flushSync(() => {
                root.render(
                  <>
                    <Yield id="A" value={2} />
                    <Yield id="B" value={2} />
                  </>,
                );
              });
            });

            expect(Scheduler).toHaveYielded(['A:2', 'B:2']);

            testMarks.push(...createUserTimingData(clearedMarks));

            const data = await preprocessData(testMarks);
            const event = data.nativeEvents.find(({type}) => type === 'click');
            expect(event.warning).toBe(null);
          });
        });

        describe('nested updates', () => {
          it('should not warn about short nested (state) updates during layout effects', async () => {
            function Component() {
              const [didMount, setDidMount] = React.useState(false);
              Scheduler.unstable_yieldValue(
                `Component ${didMount ? 'update' : 'mount'}`,
              );
              React.useLayoutEffect(() => {
                setDidMount(true);
              }, []);
              return didMount;
            }

            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() => {
              root.render(<Component />);
            });

            expect(Scheduler).toHaveYielded([
              'Component mount',
              'Component update',
            ]);

            const data = await preprocessData([
              ...createBoilerplateEntries(),
              ...createUserTimingData(clearedMarks),
            ]);

            const event = data.schedulingEvents.find(
              ({type}) => type === 'schedule-state-update',
            );
            expect(event.warning).toBe(null);
          });

          it('should not warn about short (forced) updates during layout effects', async () => {
            class Component extends React.Component {
              _didMount: boolean = false;
              componentDidMount() {
                this._didMount = true;
                this.forceUpdate();
              }
              render() {
                Scheduler.unstable_yieldValue(
                  `Component ${this._didMount ? 'update' : 'mount'}`,
                );
                return null;
              }
            }

            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() => {
              root.render(<Component />);
            });

            expect(Scheduler).toHaveYielded([
              'Component mount',
              'Component update',
            ]);

            const data = await preprocessData([
              ...createBoilerplateEntries(),
              ...createUserTimingData(clearedMarks),
            ]);

            const event = data.schedulingEvents.find(
              ({type}) => type === 'schedule-force-update',
            );
            expect(event.warning).toBe(null);
          });

          it('should warn about long nested (state) updates during layout effects', async () => {
            function Component() {
              const [didMount, setDidMount] = React.useState(false);
              Scheduler.unstable_yieldValue(
                `Component ${didMount ? 'update' : 'mount'}`,
              );
              // Fake a long render
              startTime += 20000;
              React.useLayoutEffect(() => {
                setDidMount(true);
              }, []);
              return didMount;
            }

            const cpuProfilerSample = creactCpuProfilerSample();

            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() => {
              root.render(<Component />);
            });

            expect(Scheduler).toHaveYielded([
              'Component mount',
              'Component update',
            ]);

            const testMarks = [];
            clearedMarks.forEach(markName => {
              if (markName === '--component-render-start-Component') {
                // Fake a long running render
                startTime += 20000;
              }

              testMarks.push({
                pid: ++pid,
                tid: ++tid,
                ts: ++startTime,
                args: {data: {}},
                cat: 'blink.user_timing',
                name: markName,
                ph: 'R',
              });
            });

            const data = await preprocessData([
              cpuProfilerSample,
              ...createBoilerplateEntries(),
              ...testMarks,
            ]);

            const event = data.schedulingEvents.find(
              ({type}) => type === 'schedule-state-update',
            );
            expect(event.warning).toMatchInlineSnapshot(
              `"A big nested update was scheduled during layout. Nested updates require React to re-render synchronously before the browser can paint. Consider delaying this update by moving it to a passive effect (useEffect)."`,
            );
          });

          it('should warn about long nested (forced) updates during layout effects', async () => {
            class Component extends React.Component {
              _didMount: boolean = false;
              componentDidMount() {
                this._didMount = true;
                this.forceUpdate();
              }
              render() {
                Scheduler.unstable_yieldValue(
                  `Component ${this._didMount ? 'update' : 'mount'}`,
                );
                return null;
              }
            }

            const cpuProfilerSample = creactCpuProfilerSample();

            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() => {
              root.render(<Component />);
            });

            expect(Scheduler).toHaveYielded([
              'Component mount',
              'Component update',
            ]);

            const testMarks = [];
            clearedMarks.forEach(markName => {
              if (markName === '--component-render-start-Component') {
                // Fake a long running render
                startTime += 20000;
              }

              testMarks.push({
                pid: ++pid,
                tid: ++tid,
                ts: ++startTime,
                args: {data: {}},
                cat: 'blink.user_timing',
                name: markName,
                ph: 'R',
              });
            });

            const data = await preprocessData([
              cpuProfilerSample,
              ...createBoilerplateEntries(),
              ...testMarks,
            ]);

            const event = data.schedulingEvents.find(
              ({type}) => type === 'schedule-force-update',
            );
            expect(event.warning).toMatchInlineSnapshot(
              `"A big nested update was scheduled during layout. Nested updates require React to re-render synchronously before the browser can paint. Consider delaying this update by moving it to a passive effect (useEffect)."`,
            );
          });

          it('should not warn about transition updates scheduled during commit phase', async () => {
            function Component() {
              const [value, setValue] = React.useState(0);
              // eslint-disable-next-line no-unused-vars
              const [isPending, startTransition] = React.useTransition();

              Scheduler.unstable_yieldValue(
                `Component rendered with value ${value}`,
              );

              // Fake a long render
              if (value !== 0) {
                Scheduler.unstable_yieldValue('Long render');
                startTime += 20000;
              }

              React.useLayoutEffect(() => {
                startTransition(() => {
                  setValue(1);
                });
              }, []);

              return value;
            }

            const cpuProfilerSample = creactCpuProfilerSample();

            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() => {
              root.render(<Component />);
            });

            expect(Scheduler).toHaveYielded([
              'Component rendered with value 0',
              'Component rendered with value 0',
              'Component rendered with value 1',
              'Long render',
            ]);

            const testMarks = [];
            clearedMarks.forEach(markName => {
              if (markName === '--component-render-start-Component') {
                // Fake a long running render
                startTime += 20000;
              }

              testMarks.push({
                pid: ++pid,
                tid: ++tid,
                ts: ++startTime,
                args: {data: {}},
                cat: 'blink.user_timing',
                name: markName,
                ph: 'R',
              });
            });

            const data = await preprocessData([
              cpuProfilerSample,
              ...createBoilerplateEntries(),
              ...testMarks,
            ]);

            data.schedulingEvents.forEach(event => {
              expect(event.warning).toBeNull();
            });
          });

          it('should not warn about deferred value updates scheduled during commit phase', async () => {
            function Component() {
              const [value, setValue] = React.useState(0);
              const deferredValue = React.useDeferredValue(value);

              Scheduler.unstable_yieldValue(
                `Component rendered with value ${value} and deferredValue ${deferredValue}`,
              );

              // Fake a long render
              if (deferredValue !== 0) {
                Scheduler.unstable_yieldValue('Long render');
                startTime += 20000;
              }

              React.useLayoutEffect(() => {
                setValue(1);
              }, []);

              return value + deferredValue;
            }

            const cpuProfilerSample = creactCpuProfilerSample();

            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() => {
              root.render(<Component />);
            });

            expect(Scheduler).toHaveYielded([
              'Component rendered with value 0 and deferredValue 0',
              'Component rendered with value 1 and deferredValue 0',
              'Component rendered with value 1 and deferredValue 1',
              'Long render',
            ]);

            const testMarks = [];
            clearedMarks.forEach(markName => {
              if (markName === '--component-render-start-Component') {
                // Fake a long running render
                startTime += 20000;
              }

              testMarks.push({
                pid: ++pid,
                tid: ++tid,
                ts: ++startTime,
                args: {data: {}},
                cat: 'blink.user_timing',
                name: markName,
                ph: 'R',
              });
            });

            const data = await preprocessData([
              cpuProfilerSample,
              ...createBoilerplateEntries(),
              ...testMarks,
            ]);

            data.schedulingEvents.forEach(event => {
              expect(event.warning).toBeNull();
            });
          });
        });

        describe('errors thrown while rendering', () => {
          it('shoult parse Errors thrown during render', async () => {
            spyOn(console, 'error');

            class ErrorBoundary extends React.Component {
              state = {error: null};
              componentDidCatch(error) {
                this.setState({error});
              }
              render() {
                if (this.state.error) {
                  return null;
                }
                return this.props.children;
              }
            }

            function ExampleThatThrows() {
              throw Error('Expected error');
            }

            const testMarks = [creactCpuProfilerSample()];

            // Mount and commit the app
            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() =>
              root.render(
                <ErrorBoundary>
                  <ExampleThatThrows />
                </ErrorBoundary>,
              ),
            );

            testMarks.push(...createUserTimingData(clearedMarks));

            const data = await preprocessData(testMarks);
            expect(data.thrownErrors).toHaveLength(2);
            expect(data.thrownErrors[0].message).toMatchInlineSnapshot(
              '"Expected error"',
            );
          });
        });

        describe('suspend during an update', () => {
          // This also tests an edge case where the a component suspends while profiling
          // before the first commit is logged (so the lane-to-labels map will not yet exist).
          it('should warn about suspending during an udpate', async () => {
            let promise = null;
            let resolvedValue = null;
            function readValue(value) {
              if (resolvedValue !== null) {
                return resolvedValue;
              } else if (promise === null) {
                promise = Promise.resolve(true).then(() => {
                  resolvedValue = value;
                });
              }
              throw promise;
            }

            function Component({shouldSuspend}) {
              Scheduler.unstable_yieldValue(`Component ${shouldSuspend}`);
              if (shouldSuspend) {
                readValue(123);
              }
              return null;
            }

            // Mount and commit the app
            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() =>
              root.render(
                <React.Suspense fallback="Loading...">
                  <Component shouldSuspend={false} />
                </React.Suspense>,
              ),
            );

            const testMarks = [creactCpuProfilerSample()];

            // Start profiling and suspend during a render.
            utils.act(() =>
              root.render(
                <React.Suspense fallback="Loading...">
                  <Component shouldSuspend={true} />
                </React.Suspense>,
              ),
            );

            testMarks.push(...createUserTimingData(clearedMarks));

            let data;
            await utils.actAsync(async () => {
              data = await preprocessData(testMarks);
            });
            expect(data.suspenseEvents).toHaveLength(1);
            expect(data.suspenseEvents[0].warning).toMatchInlineSnapshot(
              `"A component suspended during an update which caused a fallback to be shown. Consider using the Transition API to avoid hiding components after they've been mounted."`,
            );
          });

          it('should not warn about suspending during an transition', async () => {
            let promise = null;
            let resolvedValue = null;
            function readValue(value) {
              if (resolvedValue !== null) {
                return resolvedValue;
              } else if (promise === null) {
                promise = Promise.resolve(true).then(() => {
                  resolvedValue = value;
                });
              }
              throw promise;
            }

            function Component({shouldSuspend}) {
              Scheduler.unstable_yieldValue(`Component ${shouldSuspend}`);
              if (shouldSuspend) {
                readValue(123);
              }
              return null;
            }

            // Mount and commit the app
            const root = ReactDOMClient.createRoot(
              document.createElement('div'),
            );
            utils.act(() =>
              root.render(
                <React.Suspense fallback="Loading...">
                  <Component shouldSuspend={false} />
                </React.Suspense>,
              ),
            );

            const testMarks = [creactCpuProfilerSample()];

            // Start profiling and suspend during a render.
            await utils.actAsync(async () =>
              React.startTransition(() =>
                root.render(
                  <React.Suspense fallback="Loading...">
                    <Component shouldSuspend={true} />
                  </React.Suspense>,
                ),
              ),
            );

            testMarks.push(...createUserTimingData(clearedMarks));

            let data;
            await utils.actAsync(async () => {
              data = await preprocessData(testMarks);
            });
            expect(data.suspenseEvents).toHaveLength(1);
            expect(data.suspenseEvents[0].warning).toBe(null);
          });
        });
      });

      // TODO: Add test for snapshot base64 parsing

      // TODO: Add test for flamechart parsing
    });
  });

  // Note the in-memory tests vary slightly (e.g. timestamp values, lane numbers) from the above tests.
  // That's okay; the important thing is the the lane-to-label matches the subsequent events/measures.
  describe('DevTools hook (in memory)', () => {
    let store;

    beforeEach(() => {
      utils = require('./utils');
      utils.beforeEachProfiling();

      React = require('react');
      ReactDOM = require('react-dom');
      ReactDOMClient = require('react-dom/client');
      Scheduler = require('scheduler');

      store = global.store;

      // Start profiling so that data will actually be recorded.
      utils.act(() => store.profilerStore.startProfiling());

      global.IS_REACT_ACT_ENVIRONMENT = true;
    });

    it('should process a sample legacy render sequence', async () => {
      utils.legacyRender(<div />, document.createElement('div'));
      utils.act(() => store.profilerStore.stopProfiling());

      const data = store.profilerStore.profilingData?.timelineData;
      expect(data).toHaveLength(1);
      const timelineData = data[0];
      expect(timelineData).toMatchInlineSnapshot(`
        Object {
          "batchUIDToMeasuresMap": Map {
            1 => Array [
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "render-idle",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "render",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "commit",
              },
              Object {
                "batchUID": 1,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "layout-effects",
              },
            ],
          },
          "componentMeasures": Array [],
          "duration": 20,
          "flamechart": Array [],
          "internalModuleSourceToRanges": Map {},
          "laneToLabelMap": Map {
            1 => "Sync",
            2 => "InputContinuousHydration",
            4 => "InputContinuous",
            8 => "DefaultHydration",
            16 => "Default",
            32 => "TransitionHydration",
            64 => "Transition",
            128 => "Transition",
            256 => "Transition",
            512 => "Transition",
            1024 => "Transition",
            2048 => "Transition",
            4096 => "Transition",
            8192 => "Transition",
            16384 => "Transition",
            32768 => "Transition",
            65536 => "Transition",
            131072 => "Transition",
            262144 => "Transition",
            524288 => "Transition",
            1048576 => "Transition",
            2097152 => "Transition",
            4194304 => "Retry",
            8388608 => "Retry",
            16777216 => "Retry",
            33554432 => "Retry",
            67108864 => "Retry",
            134217728 => "SelectiveHydration",
            268435456 => "IdleHydration",
            536870912 => "Idle",
            1073741824 => "Offscreen",
          },
          "laneToReactMeasureMap": Map {
            1 => Array [
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "render-idle",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "render",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "commit",
              },
              Object {
                "batchUID": 1,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "layout-effects",
              },
            ],
            2 => Array [],
            4 => Array [],
            8 => Array [],
            16 => Array [],
            32 => Array [],
            64 => Array [],
            128 => Array [],
            256 => Array [],
            512 => Array [],
            1024 => Array [],
            2048 => Array [],
            4096 => Array [],
            8192 => Array [],
            16384 => Array [],
            32768 => Array [],
            65536 => Array [],
            131072 => Array [],
            262144 => Array [],
            524288 => Array [],
            1048576 => Array [],
            2097152 => Array [],
            4194304 => Array [],
            8388608 => Array [],
            16777216 => Array [],
            33554432 => Array [],
            67108864 => Array [],
            134217728 => Array [],
            268435456 => Array [],
            536870912 => Array [],
            1073741824 => Array [],
          },
          "nativeEvents": Array [],
          "networkMeasures": Array [],
          "otherUserTimingMarks": Array [],
          "reactVersion": "<filtered-version>",
          "schedulingEvents": Array [
            Object {
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
          ],
          "snapshotHeight": 0,
          "snapshots": Array [],
          "startTime": -10,
          "suspenseEvents": Array [],
          "thrownErrors": Array [],
        }
      `);
    });

    it('should process a sample createRoot render sequence', async () => {
      function App() {
        const [didMount, setDidMount] = React.useState(false);
        React.useEffect(() => {
          if (!didMount) {
            setDidMount(true);
          }
        });
        return true;
      }

      const root = ReactDOMClient.createRoot(document.createElement('div'));
      utils.act(() => root.render(<App />));
      utils.act(() => store.profilerStore.stopProfiling());

      const data = store.profilerStore.profilingData?.timelineData;
      expect(data).toHaveLength(1);
      const timelineData = data[0];
      expect(timelineData).toMatchInlineSnapshot(`
        Object {
          "batchUIDToMeasuresMap": Map {
            1 => Array [
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render-idle",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "commit",
              },
              Object {
                "batchUID": 1,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "layout-effects",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "passive-effects",
              },
            ],
            2 => Array [
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render-idle",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "commit",
              },
              Object {
                "batchUID": 2,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "layout-effects",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "passive-effects",
              },
            ],
          },
          "componentMeasures": Array [
            Object {
              "componentName": "App",
              "duration": 0,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "App",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "App",
              "duration": 0,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "App",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-mount",
              "warning": null,
            },
          ],
          "duration": 20,
          "flamechart": Array [],
          "internalModuleSourceToRanges": Map {},
          "laneToLabelMap": Map {
            1 => "Sync",
            2 => "InputContinuousHydration",
            4 => "InputContinuous",
            8 => "DefaultHydration",
            16 => "Default",
            32 => "TransitionHydration",
            64 => "Transition",
            128 => "Transition",
            256 => "Transition",
            512 => "Transition",
            1024 => "Transition",
            2048 => "Transition",
            4096 => "Transition",
            8192 => "Transition",
            16384 => "Transition",
            32768 => "Transition",
            65536 => "Transition",
            131072 => "Transition",
            262144 => "Transition",
            524288 => "Transition",
            1048576 => "Transition",
            2097152 => "Transition",
            4194304 => "Retry",
            8388608 => "Retry",
            16777216 => "Retry",
            33554432 => "Retry",
            67108864 => "Retry",
            134217728 => "SelectiveHydration",
            268435456 => "IdleHydration",
            536870912 => "Idle",
            1073741824 => "Offscreen",
          },
          "laneToReactMeasureMap": Map {
            1 => Array [],
            2 => Array [],
            4 => Array [],
            8 => Array [],
            16 => Array [
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render-idle",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "commit",
              },
              Object {
                "batchUID": 1,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "layout-effects",
              },
              Object {
                "batchUID": 1,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "passive-effects",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render-idle",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "render",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "commit",
              },
              Object {
                "batchUID": 2,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "layout-effects",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000010000",
                "timestamp": 10,
                "type": "passive-effects",
              },
            ],
            32 => Array [],
            64 => Array [],
            128 => Array [],
            256 => Array [],
            512 => Array [],
            1024 => Array [],
            2048 => Array [],
            4096 => Array [],
            8192 => Array [],
            16384 => Array [],
            32768 => Array [],
            65536 => Array [],
            131072 => Array [],
            262144 => Array [],
            524288 => Array [],
            1048576 => Array [],
            2097152 => Array [],
            4194304 => Array [],
            8388608 => Array [],
            16777216 => Array [],
            33554432 => Array [],
            67108864 => Array [],
            134217728 => Array [],
            268435456 => Array [],
            536870912 => Array [],
            1073741824 => Array [],
          },
          "nativeEvents": Array [],
          "networkMeasures": Array [],
          "otherUserTimingMarks": Array [],
          "reactVersion": "<filtered-version>",
          "schedulingEvents": Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "App",
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-state-update",
              "warning": null,
            },
          ],
          "snapshotHeight": 0,
          "snapshots": Array [],
          "startTime": -10,
          "suspenseEvents": Array [],
          "thrownErrors": Array [],
        }
      `);
    });
  });
});
