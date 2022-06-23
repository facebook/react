/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import {normalizeCodeLocInfo} from './utils';

describe('Timeline profiler', () => {
  let React;
  let ReactDOMClient;
  let Scheduler;
  let renderHelper;
  let renderRootHelper;
  let store;
  let unmountFns;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    unmountFns = [];
    renderHelper = element => {
      const unmountFn = utils.legacyRender(element);
      unmountFns.push(unmountFn);
      return unmountFn;
    };
    renderRootHelper = element => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      root.render(element);
      const unmountFn = () => root.unmount();
      unmountFns.push(unmountFn);
      return unmountFn;
    };

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');

    store = global.store;
  });

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

    function dispatchAndSetCurrentEvent(element, event) {
      try {
        window.event = event;
        element.dispatchEvent(event);
      } finally {
        window.event = undefined;
      }
    }

    beforeEach(() => {
      setPerformanceMock = require('react-devtools-shared/src/backend/profilingHooks')
        .setPerformanceMock_ONLY_FOR_TESTING;
      setPerformanceMock(createUserTimingPolyfill());
    });

    afterEach(() => {
      // Verify all logged marks also get cleared.
      expect(marks).toHaveLength(0);

      unmountFns.forEach(unmountFn => unmountFn());

      setPerformanceMock(null);
    });

    // @reactVersion >=18.0
    it('should mark sync render without suspends or state updates', () => {
      renderHelper(<div />);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-1",
          "--render-start-1",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-1",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark concurrent render without suspends or state updates', () => {
      renderRootHelper(<div />);

      expect(clearedMarks).toMatchInlineSnapshot(`
            Array [
              "--schedule-render-16",
            ]
        `);

      clearPendingMarks();

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark render yields', async () => {
      function Bar() {
        Scheduler.unstable_yieldValue('Bar');
        return null;
      }

      function Foo() {
        Scheduler.unstable_yieldValue('Foo');
        return <Bar />;
      }

      React.startTransition(() => {
        renderRootHelper(<Foo />);
      });

      // Do one step of work.
      expect(Scheduler).toFlushAndYieldThrough(['Foo']);

      expect(clearedMarks).toMatchInlineSnapshot(`
            Array [
              "--schedule-render-64",
              "--render-start-64",
              "--component-render-start-Foo",
              "--component-render-stop",
              "--render-yield",
            ]
        `);
    });

    // @reactVersion >=18.0
    it('should mark sync render with suspense that resolves', async () => {
      const fakeSuspensePromise = Promise.resolve(true);
      function Example() {
        throw fakeSuspensePromise;
      }

      renderHelper(
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>,
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-1",
          "--render-start-1",
          "--component-render-start-Example",
          "--component-render-stop",
          "--suspense-suspend-0-Example-mount-1-",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-1",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);

      clearPendingMarks();

      await fakeSuspensePromise;
      expect(clearedMarks).toMatchInlineSnapshot(`
                Array [
                  "--suspense-resolved-0-Example",
                ]
          `);
    });

    // @reactVersion >=18.0
    it('should mark sync render with suspense that rejects', async () => {
      const fakeSuspensePromise = Promise.reject(new Error('error'));
      function Example() {
        throw fakeSuspensePromise;
      }

      renderHelper(
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>,
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-1",
          "--render-start-1",
          "--component-render-start-Example",
          "--component-render-stop",
          "--suspense-suspend-0-Example-mount-1-",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-1",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);

      clearPendingMarks();

      await expect(fakeSuspensePromise).rejects.toThrow();
      expect(clearedMarks).toContain(`--suspense-rejected-0-Example`);
    });

    // @reactVersion >=18.0
    it('should mark concurrent render with suspense that resolves', async () => {
      const fakeSuspensePromise = Promise.resolve(true);
      function Example() {
        throw fakeSuspensePromise;
      }

      renderRootHelper(
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>,
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
            Array [
              "--schedule-render-16",
            ]
        `);

      clearPendingMarks();

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-Example",
          "--component-render-stop",
          "--suspense-suspend-0-Example-mount-16-",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);

      clearPendingMarks();

      await fakeSuspensePromise;
      expect(clearedMarks).toMatchInlineSnapshot(`
            Array [
              "--suspense-resolved-0-Example",
            ]
        `);
    });

    // @reactVersion >=18.0
    it('should mark concurrent render with suspense that rejects', async () => {
      const fakeSuspensePromise = Promise.reject(new Error('error'));
      function Example() {
        throw fakeSuspensePromise;
      }

      renderRootHelper(
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>,
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
            Array [
              "--schedule-render-16",
            ]
        `);

      clearPendingMarks();

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-Example",
          "--component-render-stop",
          "--suspense-suspend-0-Example-mount-16-",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);

      clearPendingMarks();

      await expect(fakeSuspensePromise).rejects.toThrow();
      expect(clearedMarks).toMatchInlineSnapshot(`
                Array [
                  "--suspense-rejected-0-Example",
                ]
          `);
    });

    // @reactVersion >=18.0
    it('should mark cascading class component state updates', () => {
      class Example extends React.Component {
        state = {didMount: false};
        componentDidMount() {
          this.setState({didMount: true});
        }
        render() {
          return null;
        }
      }

      renderRootHelper(<Example />);

      expect(clearedMarks).toMatchInlineSnapshot(`
            Array [
              "--schedule-render-16",
            ]
        `);

      clearPendingMarks();

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--schedule-state-update-1-Example",
          "--layout-effects-stop",
          "--render-start-1",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--commit-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark cascading class component force updates', () => {
      class Example extends React.Component {
        componentDidMount() {
          this.forceUpdate();
        }
        render() {
          return null;
        }
      }

      renderRootHelper(<Example />);

      expect(clearedMarks).toMatchInlineSnapshot(`
                Array [
                  "--schedule-render-16",
                ]
          `);

      clearPendingMarks();

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--schedule-forced-update-1-Example",
          "--layout-effects-stop",
          "--render-start-1",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--commit-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark render phase state updates for class component', () => {
      class Example extends React.Component {
        state = {didRender: false};
        render() {
          if (this.state.didRender === false) {
            this.setState({didRender: true});
          }
          return null;
        }
      }

      renderRootHelper(<Example />);

      expect(clearedMarks).toMatchInlineSnapshot(`
                Array [
                  "--schedule-render-16",
                ]
          `);

      clearPendingMarks();

      let errorMessage;
      spyOn(console, 'error').and.callFake(message => {
        errorMessage = message;
      });

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(errorMessage).toContain(
        'Cannot update during an existing state transition',
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-Example",
          "--schedule-state-update-16-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark render phase force updates for class component', () => {
      let forced = false;
      class Example extends React.Component {
        render() {
          if (!forced) {
            forced = true;
            this.forceUpdate();
          }
          return null;
        }
      }

      renderRootHelper(<Example />);

      expect(clearedMarks).toMatchInlineSnapshot(`
                Array [
                  "--schedule-render-16",
                ]
          `);

      clearPendingMarks();

      let errorMessage;
      spyOn(console, 'error').and.callFake(message => {
        errorMessage = message;
      });

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(errorMessage).toContain(
        'Cannot update during an existing state transition',
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-Example",
          "--schedule-forced-update-16-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark cascading layout updates', () => {
      function Example() {
        const [didMount, setDidMount] = React.useState(false);
        React.useLayoutEffect(() => {
          setDidMount(true);
        }, []);
        return didMount;
      }

      renderRootHelper(<Example />);

      expect(clearedMarks).toMatchInlineSnapshot(`
                Array [
                  "--schedule-render-16",
                ]
          `);

      clearPendingMarks();

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--component-layout-effect-mount-start-Example",
          "--schedule-state-update-1-Example",
          "--component-layout-effect-mount-stop",
          "--layout-effects-stop",
          "--render-start-1",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--commit-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark cascading passive updates', () => {
      function Example() {
        const [didMount, setDidMount] = React.useState(false);
        React.useEffect(() => {
          setDidMount(true);
        }, []);
        return didMount;
      }

      renderRootHelper(<Example />);

      expect(Scheduler).toFlushAndYield([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-16",
          "--render-start-16",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--layout-effects-stop",
          "--commit-stop",
          "--passive-effects-start-16",
          "--component-passive-effect-mount-start-Example",
          "--schedule-state-update-16-Example",
          "--component-passive-effect-mount-stop",
          "--passive-effects-stop",
          "--render-start-16",
          "--component-render-start-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark render phase updates', () => {
      function Example() {
        const [didRender, setDidRender] = React.useState(false);
        if (!didRender) {
          setDidRender(true);
        }
        return didRender;
      }

      renderRootHelper(<Example />);

      expect(Scheduler).toFlushAndYield([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-16",
          "--render-start-16",
          "--component-render-start-Example",
          "--schedule-state-update-16-Example",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark sync render that throws', async () => {
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

      renderHelper(
        <ErrorBoundary>
          <ExampleThatThrows />
        </ErrorBoundary>,
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-1",
          "--render-start-1",
          "--component-render-start-ErrorBoundary",
          "--component-render-stop",
          "--component-render-start-ExampleThatThrows",
          "--component-render-start-ExampleThatThrows",
          "--component-render-stop",
          "--error-ExampleThatThrows-mount-Expected error",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-1",
          "--schedule-state-update-1-ErrorBoundary",
          "--layout-effects-stop",
          "--commit-stop",
          "--render-start-1",
          "--component-render-start-ErrorBoundary",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark concurrent render that throws', async () => {
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
        // eslint-disable-next-line no-throw-literal
        throw 'Expected error';
      }

      renderRootHelper(
        <ErrorBoundary>
          <ExampleThatThrows />
        </ErrorBoundary>,
      );

      expect(clearedMarks).toMatchInlineSnapshot(`
                Array [
                  "--schedule-render-16",
                ]
          `);

      clearPendingMarks();

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--render-start-16",
          "--component-render-start-ErrorBoundary",
          "--component-render-stop",
          "--component-render-start-ExampleThatThrows",
          "--component-render-start-ExampleThatThrows",
          "--component-render-stop",
          "--error-ExampleThatThrows-mount-Expected error",
          "--render-stop",
          "--render-start-16",
          "--component-render-start-ErrorBoundary",
          "--component-render-stop",
          "--component-render-start-ExampleThatThrows",
          "--component-render-start-ExampleThatThrows",
          "--component-render-stop",
          "--error-ExampleThatThrows-mount-Expected error",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--schedule-state-update-1-ErrorBoundary",
          "--layout-effects-stop",
          "--render-start-1",
          "--component-render-start-ErrorBoundary",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--commit-stop",
          "--commit-stop",
        ]
      `);
    });

    // @reactVersion >=18.0
    it('should mark passive and layout effects', async () => {
      function ComponentWithEffects() {
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout 1 mount');
          return () => {
            Scheduler.unstable_yieldValue('layout 1 unmount');
          };
        }, []);

        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive 1 mount');
          return () => {
            Scheduler.unstable_yieldValue('passive 1 unmount');
          };
        }, []);

        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout 2 mount');
          return () => {
            Scheduler.unstable_yieldValue('layout 2 unmount');
          };
        }, []);

        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive 2 mount');
          return () => {
            Scheduler.unstable_yieldValue('passive 2 unmount');
          };
        }, []);

        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive 3 mount');
          return () => {
            Scheduler.unstable_yieldValue('passive 3 unmount');
          };
        }, []);

        return null;
      }

      const unmount = renderRootHelper(<ComponentWithEffects />);

      expect(Scheduler).toFlushUntilNextPaint([
        'layout 1 mount',
        'layout 2 mount',
      ]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-16",
          "--render-start-16",
          "--component-render-start-ComponentWithEffects",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-16",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--component-layout-effect-mount-start-ComponentWithEffects",
          "--component-layout-effect-mount-stop",
          "--component-layout-effect-mount-start-ComponentWithEffects",
          "--component-layout-effect-mount-stop",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);

      clearPendingMarks();

      expect(Scheduler).toFlushAndYield([
        'passive 1 mount',
        'passive 2 mount',
        'passive 3 mount',
      ]);

      expect(clearedMarks).toMatchInlineSnapshot(`
            Array [
              "--passive-effects-start-16",
              "--component-passive-effect-mount-start-ComponentWithEffects",
              "--component-passive-effect-mount-stop",
              "--component-passive-effect-mount-start-ComponentWithEffects",
              "--component-passive-effect-mount-stop",
              "--component-passive-effect-mount-start-ComponentWithEffects",
              "--component-passive-effect-mount-stop",
              "--passive-effects-stop",
            ]
        `);

      clearPendingMarks();

      expect(Scheduler).toFlushAndYield([]);

      unmount();

      expect(Scheduler).toHaveYielded([
        'layout 1 unmount',
        'layout 2 unmount',
        'passive 1 unmount',
        'passive 2 unmount',
        'passive 3 unmount',
      ]);

      expect(clearedMarks).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-1",
          "--render-start-1",
          "--render-stop",
          "--commit-start-1",
          "--react-version-<filtered-version>",
          "--profiler-version-1",
          "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
          "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--component-layout-effect-unmount-start-ComponentWithEffects",
          "--component-layout-effect-unmount-stop",
          "--component-layout-effect-unmount-start-ComponentWithEffects",
          "--component-layout-effect-unmount-stop",
          "--layout-effects-start-1",
          "--layout-effects-stop",
          "--passive-effects-start-1",
          "--component-passive-effect-unmount-start-ComponentWithEffects",
          "--component-passive-effect-unmount-stop",
          "--component-passive-effect-unmount-start-ComponentWithEffects",
          "--component-passive-effect-unmount-stop",
          "--component-passive-effect-unmount-start-ComponentWithEffects",
          "--component-passive-effect-unmount-stop",
          "--passive-effects-stop",
          "--commit-stop",
        ]
      `);
    });

    describe('lane labels', () => {
      // @reactVersion >=18.0
      it('regression test SyncLane', () => {
        renderHelper(<div />);

        expect(clearedMarks).toMatchInlineSnapshot(`
          Array [
            "--schedule-render-1",
            "--render-start-1",
            "--render-stop",
            "--commit-start-1",
            "--react-version-<filtered-version>",
            "--profiler-version-1",
            "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
            "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
            "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
            "--layout-effects-start-1",
            "--layout-effects-stop",
            "--commit-stop",
          ]
        `);
      });

      // @reactVersion >=18.0
      it('regression test DefaultLane', () => {
        renderRootHelper(<div />);
        expect(clearedMarks).toMatchInlineSnapshot(`
                    Array [
                      "--schedule-render-16",
                    ]
              `);
      });

      // @reactVersion >=18.0
      it('regression test InputDiscreteLane', async () => {
        const targetRef = React.createRef(null);

        function App() {
          const [count, setCount] = React.useState(0);
          const handleClick = () => {
            setCount(count + 1);
          };
          return <button ref={targetRef} onClick={handleClick} />;
        }

        renderRootHelper(<App />);
        expect(Scheduler).toFlushAndYield([]);

        clearedMarks.splice(0);

        targetRef.current.click();

        // Wait a frame, for React to process the "click" update.
        await Promise.resolve();

        expect(clearedMarks).toMatchInlineSnapshot(`
          Array [
            "--schedule-state-update-1-App",
            "--render-start-1",
            "--component-render-start-App",
            "--component-render-stop",
            "--render-stop",
            "--commit-start-1",
            "--react-version-<filtered-version>",
            "--profiler-version-1",
            "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
            "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
            "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
            "--layout-effects-start-1",
            "--layout-effects-stop",
            "--commit-stop",
          ]
        `);
      });

      // @reactVersion >=18.0
      it('regression test InputContinuousLane', async () => {
        const targetRef = React.createRef(null);

        function App() {
          const [count, setCount] = React.useState(0);
          const handleMouseOver = () => setCount(count + 1);
          return <div ref={targetRef} onMouseOver={handleMouseOver} />;
        }

        renderRootHelper(<App />);
        expect(Scheduler).toFlushAndYield([]);

        clearedMarks.splice(0);

        const event = document.createEvent('MouseEvents');
        event.initEvent('mouseover', true, true);
        dispatchAndSetCurrentEvent(targetRef.current, event);

        expect(Scheduler).toFlushAndYield([]);

        expect(clearedMarks).toMatchInlineSnapshot(`
          Array [
            "--schedule-state-update-4-App",
            "--render-start-4",
            "--component-render-start-App",
            "--component-render-stop",
            "--render-stop",
            "--commit-start-4",
            "--react-version-<filtered-version>",
            "--profiler-version-1",
            "--react-internal-module-start-  at filtered (<anonymous>:0:0)",
            "--react-internal-module-stop-  at filtered (<anonymous>:1:1)",
            "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
            "--layout-effects-start-4",
            "--layout-effects-stop",
            "--commit-stop",
          ]
        `);
      });
    });
  });

  describe('DevTools hook (in memory)', () => {
    let getBatchOfWork;
    let stopProfilingAndGetTimelineData;

    beforeEach(() => {
      getBatchOfWork = index => {
        const timelineData = stopProfilingAndGetTimelineData();
        if (timelineData) {
          if (timelineData.batchUIDToMeasuresMap.size > index) {
            return Array.from(timelineData.batchUIDToMeasuresMap.values())[
              index
            ];
          }
        }

        return null;
      };

      stopProfilingAndGetTimelineData = () => {
        utils.act(() => store.profilerStore.stopProfiling());

        const timelineData = store.profilerStore.profilingData?.timelineData;

        if (timelineData) {
          expect(timelineData).toHaveLength(1);

          // normalize the location for component stack source
          // for snapshot testing
          timelineData.forEach(data => {
            data.schedulingEvents.forEach(event => {
              if (event.componentStack) {
                event.componentStack = normalizeCodeLocInfo(
                  event.componentStack,
                );
              }
            });
          });

          return timelineData[0];
        } else {
          return null;
        }
      };
    });

    afterEach(() => {
      unmountFns.forEach(unmountFn => unmountFn());
    });

    describe('when profiling', () => {
      beforeEach(() => {
        utils.act(() => store.profilerStore.startProfiling());
      });

      // @reactVersion >=18.0
      it('should mark sync render without suspends or state updates', () => {
        renderHelper(<div />);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark concurrent render without suspends or state updates', () => {
        utils.act(() => renderRootHelper(<div />));

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark concurrent render without suspends or state updates', () => {
        let updaterFn;

        function Example() {
          const setHigh = React.useState(0)[1];
          const setLow = React.useState(0)[1];
          const startTransition = React.useTransition()[1];

          updaterFn = () => {
            startTransition(() => {
              setLow(prevLow => prevLow + 1);
            });
            setHigh(prevHigh => prevHigh + 1);
          };

          Scheduler.unstable_advanceTime(10);

          return null;
        }

        utils.act(() => renderRootHelper(<Example />));
        utils.act(() => store.profilerStore.stopProfiling());
        utils.act(() => store.profilerStore.startProfiling());
        utils.act(updaterFn);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000000000100",
              "timestamp": 10,
              "type": "schedule-state-update",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000001000000",
              "timestamp": 10,
              "type": "schedule-state-update",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000001000000",
              "timestamp": 10,
              "type": "schedule-state-update",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 0,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
      });

      // @reactVersion >=18.0
      it('should mark render yields', async () => {
        function Bar() {
          Scheduler.unstable_yieldValue('Bar');
          return null;
        }

        function Foo() {
          Scheduler.unstable_yieldValue('Foo');
          return <Bar />;
        }

        React.startTransition(() => {
          renderRootHelper(<Foo />);
        });

        // Do one step of work.
        expect(Scheduler).toFlushAndYieldThrough(['Foo']);

        // Finish flushing so React commits;
        // Unless we do this, the ProfilerStore won't collect Profiling data.
        expect(Scheduler).toFlushAndYield(['Bar']);

        // Since we yielded, the batch should report two separate "render" chunks.
        const batch = getBatchOfWork(0);
        expect(batch.filter(({type}) => type === 'render')).toHaveLength(2);
      });

      it('should mark sync render with suspense that resolves', async () => {
        let resolveFn;
        let resolved = false;
        const suspensePromise = new Promise(resolve => {
          resolveFn = () => {
            resolved = true;
            resolve();
          };
        });

        function Example() {
          Scheduler.unstable_yieldValue(resolved ? 'resolved' : 'suspended');
          if (!resolved) {
            throw suspensePromise;
          }
          return null;
        }

        renderHelper(
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>,
        );

        expect(Scheduler).toHaveYielded(['suspended']);

        Scheduler.unstable_advanceTime(10);
        resolveFn();
        await suspensePromise;

        expect(Scheduler).toFlushAndYield(['resolved']);

        const timelineData = stopProfilingAndGetTimelineData();

        // Verify the Suspense event and duration was recorded.
        expect(timelineData.suspenseEvents).toHaveLength(1);
        const suspenseEvent = timelineData.suspenseEvents[0];
        expect(suspenseEvent).toMatchInlineSnapshot(`
          Object {
            "componentName": "Example",
            "depth": 0,
            "duration": 10,
            "id": "0",
            "phase": "mount",
            "promiseName": "",
            "resolution": "resolved",
            "timestamp": 10,
            "type": "suspense",
            "warning": null,
          }
        `);

        // There should be two batches of renders: Suspeneded and resolved.
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toHaveLength(2);
      });

      // @reactVersion >=18.0
      it('should mark sync render with suspense that rejects', async () => {
        let rejectFn;
        let rejected = false;
        const suspensePromise = new Promise((resolve, reject) => {
          rejectFn = () => {
            rejected = true;
            reject(new Error('error'));
          };
        });

        function Example() {
          Scheduler.unstable_yieldValue(rejected ? 'rejected' : 'suspended');
          if (!rejected) {
            throw suspensePromise;
          }
          return null;
        }

        renderHelper(
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>,
        );

        expect(Scheduler).toHaveYielded(['suspended']);

        Scheduler.unstable_advanceTime(10);
        rejectFn();
        await expect(suspensePromise).rejects.toThrow();

        expect(Scheduler).toHaveYielded(['rejected']);

        const timelineData = stopProfilingAndGetTimelineData();

        // Verify the Suspense event and duration was recorded.
        expect(timelineData.suspenseEvents).toHaveLength(1);
        const suspenseEvent = timelineData.suspenseEvents[0];
        expect(suspenseEvent).toMatchInlineSnapshot(`
          Object {
            "componentName": "Example",
            "depth": 0,
            "duration": 10,
            "id": "0",
            "phase": "mount",
            "promiseName": "",
            "resolution": "rejected",
            "timestamp": 10,
            "type": "suspense",
            "warning": null,
          }
        `);

        // There should be two batches of renders: Suspeneded and resolved.
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toHaveLength(2);
      });

      // @reactVersion >=18.0
      it('should mark concurrent render with suspense that resolves', async () => {
        let resolveFn;
        let resolved = false;
        const suspensePromise = new Promise(resolve => {
          resolveFn = () => {
            resolved = true;
            resolve();
          };
        });

        function Example() {
          Scheduler.unstable_yieldValue(resolved ? 'resolved' : 'suspended');
          if (!resolved) {
            throw suspensePromise;
          }
          return null;
        }

        renderRootHelper(
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>,
        );

        expect(Scheduler).toFlushAndYield(['suspended']);

        Scheduler.unstable_advanceTime(10);
        resolveFn();
        await suspensePromise;

        expect(Scheduler).toFlushAndYield(['resolved']);

        const timelineData = stopProfilingAndGetTimelineData();

        // Verify the Suspense event and duration was recorded.
        expect(timelineData.suspenseEvents).toHaveLength(1);
        const suspenseEvent = timelineData.suspenseEvents[0];
        expect(suspenseEvent).toMatchInlineSnapshot(`
          Object {
            "componentName": "Example",
            "depth": 0,
            "duration": 10,
            "id": "0",
            "phase": "mount",
            "promiseName": "",
            "resolution": "resolved",
            "timestamp": 10,
            "type": "suspense",
            "warning": null,
          }
        `);

        // There should be two batches of renders: Suspeneded and resolved.
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toHaveLength(2);
      });

      // @reactVersion >=18.0
      it('should mark concurrent render with suspense that rejects', async () => {
        let rejectFn;
        let rejected = false;
        const suspensePromise = new Promise((resolve, reject) => {
          rejectFn = () => {
            rejected = true;
            reject(new Error('error'));
          };
        });

        function Example() {
          Scheduler.unstable_yieldValue(rejected ? 'rejected' : 'suspended');
          if (!rejected) {
            throw suspensePromise;
          }
          return null;
        }

        renderRootHelper(
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>,
        );

        expect(Scheduler).toFlushAndYield(['suspended']);

        Scheduler.unstable_advanceTime(10);
        rejectFn();
        await expect(suspensePromise).rejects.toThrow();

        expect(Scheduler).toFlushAndYield(['rejected']);

        const timelineData = stopProfilingAndGetTimelineData();

        // Verify the Suspense event and duration was recorded.
        expect(timelineData.suspenseEvents).toHaveLength(1);
        const suspenseEvent = timelineData.suspenseEvents[0];
        expect(suspenseEvent).toMatchInlineSnapshot(`
          Object {
            "componentName": "Example",
            "depth": 0,
            "duration": 10,
            "id": "0",
            "phase": "mount",
            "promiseName": "",
            "resolution": "rejected",
            "timestamp": 10,
            "type": "suspense",
            "warning": null,
          }
        `);

        // There should be two batches of renders: Suspeneded and resolved.
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toHaveLength(2);
      });

      // @reactVersion >=18.0
      it('should mark cascading class component state updates', () => {
        class Example extends React.Component {
          state = {didMount: false};
          componentDidMount() {
            this.setState({didMount: true});
          }
          render() {
            Scheduler.unstable_advanceTime(10);
            Scheduler.unstable_yieldValue(
              this.state.didMount ? 'update' : 'mount',
            );
            return null;
          }
        }

        renderRootHelper(<Example />);

        expect(Scheduler).toFlushUntilNextPaint(['mount', 'update']);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 20,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark cascading class component force updates', () => {
        let forced = false;
        class Example extends React.Component {
          componentDidMount() {
            forced = true;
            this.forceUpdate();
          }
          render() {
            Scheduler.unstable_advanceTime(10);
            Scheduler.unstable_yieldValue(forced ? 'force update' : 'mount');
            return null;
          }
        }

        renderRootHelper(<Example />);

        expect(Scheduler).toFlushUntilNextPaint(['mount', 'force update']);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 20,
              "type": "schedule-force-update",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark render phase state updates for class component', () => {
        class Example extends React.Component {
          state = {didRender: false};
          render() {
            if (this.state.didRender === false) {
              this.setState({didRender: true});
            }
            Scheduler.unstable_advanceTime(10);
            Scheduler.unstable_yieldValue(
              this.state.didRender ? 'second render' : 'first render',
            );
            return null;
          }
        }

        renderRootHelper(<Example />);

        let errorMessage;
        spyOn(console, 'error').and.callFake(message => {
          errorMessage = message;
        });

        expect(Scheduler).toFlushAndYield(['first render', 'second render']);

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(errorMessage).toContain(
          'Cannot update during an existing state transition',
        );

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark render phase force updates for class component', () => {
        let forced = false;
        class Example extends React.Component {
          render() {
            Scheduler.unstable_advanceTime(10);
            Scheduler.unstable_yieldValue(forced ? 'force update' : 'render');
            if (!forced) {
              forced = true;
              this.forceUpdate();
            }
            return null;
          }
        }

        renderRootHelper(<Example />);

        let errorMessage;
        spyOn(console, 'error').and.callFake(message => {
          errorMessage = message;
        });

        expect(Scheduler).toFlushAndYield(['render', 'force update']);

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(errorMessage).toContain(
          'Cannot update during an existing state transition',
        );

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 20,
              "type": "schedule-force-update",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark cascading layout updates', () => {
        function Example() {
          const [didMount, setDidMount] = React.useState(false);
          React.useLayoutEffect(() => {
            Scheduler.unstable_advanceTime(1);
            setDidMount(true);
          }, []);
          Scheduler.unstable_advanceTime(10);
          Scheduler.unstable_yieldValue(didMount ? 'update' : 'mount');
          return didMount;
        }

        renderRootHelper(<Example />);

        expect(Scheduler).toFlushAndYield(['mount', 'update']);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 1,
              "timestamp": 20,
              "type": "layout-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 21,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 21,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark cascading passive updates', () => {
        function Example() {
          const [didMount, setDidMount] = React.useState(false);
          React.useEffect(() => {
            Scheduler.unstable_advanceTime(1);
            setDidMount(true);
          }, []);
          Scheduler.unstable_advanceTime(10);
          Scheduler.unstable_yieldValue(didMount ? 'update' : 'mount');
          return didMount;
        }

        renderRootHelper(<Example />);
        expect(Scheduler).toFlushAndYield(['mount', 'update']);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(2);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 1,
              "timestamp": 20,
              "type": "passive-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "duration": 10,
              "timestamp": 21,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 21,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark render phase updates', () => {
        function Example() {
          const [didRender, setDidRender] = React.useState(false);
          Scheduler.unstable_advanceTime(10);
          if (!didRender) {
            setDidRender(true);
          }
          Scheduler.unstable_yieldValue(didRender ? 'update' : 'mount');
          return didRender;
        }

        renderRootHelper(<Example />);
        expect(Scheduler).toFlushAndYield(['mount', 'update']);

        const timelineData = stopProfilingAndGetTimelineData();
        // Render phase updates should be retried as part of the same batch.
        expect(timelineData.batchUIDToMeasuresMap.size).toBe(1);
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "Example",
              "duration": 20,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Example",
              "componentStack": "
              in Example (at **)",
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 20,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark sync render that throws', async () => {
        spyOn(console, 'error');

        class ErrorBoundary extends React.Component {
          state = {error: null};
          componentDidCatch(error) {
            this.setState({error});
          }
          render() {
            Scheduler.unstable_advanceTime(10);
            if (this.state.error) {
              Scheduler.unstable_yieldValue('ErrorBoundary fallback');
              return null;
            }
            Scheduler.unstable_yieldValue('ErrorBoundary render');
            return this.props.children;
          }
        }

        function ExampleThatThrows() {
          Scheduler.unstable_yieldValue('ExampleThatThrows');
          throw Error('Expected error');
        }

        renderHelper(
          <ErrorBoundary>
            <ExampleThatThrows />
          </ErrorBoundary>,
        );

        expect(Scheduler).toHaveYielded([
          'ErrorBoundary render',
          'ExampleThatThrows',
          'ExampleThatThrows',
          'ErrorBoundary fallback',
        ]);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "ErrorBoundary",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "ExampleThatThrows",
              "duration": 0,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "ErrorBoundary",
              "duration": 10,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "ErrorBoundary",
              "componentStack": "
              in ErrorBoundary (at **)",
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 20,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.thrownErrors).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "ExampleThatThrows",
              "message": "Expected error",
              "phase": "mount",
              "timestamp": 20,
              "type": "thrown-error",
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark concurrent render that throws', async () => {
        spyOn(console, 'error');

        class ErrorBoundary extends React.Component {
          state = {error: null};
          componentDidCatch(error) {
            this.setState({error});
          }
          render() {
            Scheduler.unstable_advanceTime(10);
            if (this.state.error) {
              Scheduler.unstable_yieldValue('ErrorBoundary fallback');
              return null;
            }
            Scheduler.unstable_yieldValue('ErrorBoundary render');
            return this.props.children;
          }
        }

        function ExampleThatThrows() {
          Scheduler.unstable_yieldValue('ExampleThatThrows');
          // eslint-disable-next-line no-throw-literal
          throw 'Expected error';
        }

        renderRootHelper(
          <ErrorBoundary>
            <ExampleThatThrows />
          </ErrorBoundary>,
        );

        expect(Scheduler).toFlushAndYield([
          'ErrorBoundary render',
          'ExampleThatThrows',
          'ExampleThatThrows',
          'ErrorBoundary render',
          'ExampleThatThrows',
          'ExampleThatThrows',
          'ErrorBoundary fallback',
        ]);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "ErrorBoundary",
              "duration": 10,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "ExampleThatThrows",
              "duration": 0,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "ErrorBoundary",
              "duration": 10,
              "timestamp": 20,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "ExampleThatThrows",
              "duration": 0,
              "timestamp": 30,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "ErrorBoundary",
              "duration": 10,
              "timestamp": 30,
              "type": "render",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "ErrorBoundary",
              "componentStack": "
              in ErrorBoundary (at **)",
              "lanes": "0b0000000000000000000000000000001",
              "timestamp": 30,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.thrownErrors).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "ExampleThatThrows",
              "message": "Expected error",
              "phase": "mount",
              "timestamp": 20,
              "type": "thrown-error",
            },
            Object {
              "componentName": "ExampleThatThrows",
              "message": "Expected error",
              "phase": "mount",
              "timestamp": 30,
              "type": "thrown-error",
            },
          ]
        `);
      });

      // @reactVersion >=18.0
      it('should mark passive and layout effects', async () => {
        function ComponentWithEffects() {
          React.useLayoutEffect(() => {
            Scheduler.unstable_yieldValue('layout 1 mount');
            return () => {
              Scheduler.unstable_yieldValue('layout 1 unmount');
            };
          }, []);

          React.useEffect(() => {
            Scheduler.unstable_yieldValue('passive 1 mount');
            return () => {
              Scheduler.unstable_yieldValue('passive 1 unmount');
            };
          }, []);

          React.useLayoutEffect(() => {
            Scheduler.unstable_yieldValue('layout 2 mount');
            return () => {
              Scheduler.unstable_yieldValue('layout 2 unmount');
            };
          }, []);

          React.useEffect(() => {
            Scheduler.unstable_yieldValue('passive 2 mount');
            return () => {
              Scheduler.unstable_yieldValue('passive 2 unmount');
            };
          }, []);

          React.useEffect(() => {
            Scheduler.unstable_yieldValue('passive 3 mount');
            return () => {
              Scheduler.unstable_yieldValue('passive 3 unmount');
            };
          }, []);

          return null;
        }

        const unmount = renderRootHelper(<ComponentWithEffects />);

        expect(Scheduler).toFlushUntilNextPaint([
          'layout 1 mount',
          'layout 2 mount',
        ]);

        expect(Scheduler).toFlushAndYield([
          'passive 1 mount',
          'passive 2 mount',
          'passive 3 mount',
        ]);

        expect(Scheduler).toFlushAndYield([]);

        unmount();

        expect(Scheduler).toHaveYielded([
          'layout 1 unmount',
          'layout 2 unmount',
          'passive 1 unmount',
          'passive 2 unmount',
          'passive 3 unmount',
        ]);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.componentMeasures).toMatchInlineSnapshot(`
          Array [
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "render",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "layout-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "layout-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-mount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "layout-effect-unmount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "layout-effect-unmount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-unmount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-unmount",
              "warning": null,
            },
            Object {
              "componentName": "ComponentWithEffects",
              "duration": 0,
              "timestamp": 10,
              "type": "passive-effect-unmount",
              "warning": null,
            },
          ]
        `);
        expect(timelineData.batchUIDToMeasuresMap).toMatchInlineSnapshot(`
          Map {
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
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "render-idle",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "render",
              },
              Object {
                "batchUID": 2,
                "depth": 0,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "commit",
              },
              Object {
                "batchUID": 2,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "layout-effects",
              },
              Object {
                "batchUID": 2,
                "depth": 1,
                "duration": 0,
                "lanes": "0b0000000000000000000000000000001",
                "timestamp": 10,
                "type": "passive-effects",
              },
            ],
          }
        `);
      });

      it('should generate component stacks for state update', async () => {
        function CommponentWithChildren({initialRender}) {
          Scheduler.unstable_yieldValue('Render ComponentWithChildren');
          return <Child initialRender={initialRender} />;
        }

        function Child({initialRender}) {
          const [didRender, setDidRender] = React.useState(initialRender);
          if (!didRender) {
            setDidRender(true);
          }
          Scheduler.unstable_yieldValue('Render Child');
          return null;
        }

        renderRootHelper(<CommponentWithChildren initialRender={false} />);

        expect(Scheduler).toFlushAndYield([
          'Render ComponentWithChildren',
          'Render Child',
          'Render Child',
        ]);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData.schedulingEvents).toMatchInlineSnapshot(`
          Array [
            Object {
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-render",
              "warning": null,
            },
            Object {
              "componentName": "Child",
              "componentStack": "
              in Child (at **)
              in CommponentWithChildren (at **)",
              "lanes": "0b0000000000000000000000000010000",
              "timestamp": 10,
              "type": "schedule-state-update",
              "warning": null,
            },
          ]
        `);
      });
    });

    describe('when not profiling', () => {
      // @reactVersion >=18.0
      it('should not log any marks', () => {
        renderHelper(<div />);

        const timelineData = stopProfilingAndGetTimelineData();
        expect(timelineData).toBeNull();
      });
    });
  });
});
