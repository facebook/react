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
  let Scheduler;
  let renderHelper;
  let renderRootHelper;
  let unmountFns;
  let utils;

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
        return `${markName.substr(0, 29)}-<filtered-file-system-path>`;
      } else if (markName.startsWith('--react-internal-module-stop')) {
        return `${markName.substr(0, 28)}-<filtered-file-system-path>`;
      } else if (markName.startsWith('--react-version')) {
        return `${markName.substr(0, 15)}-<filtered-version>`;
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
      const root = ReactDOM.createRoot(container);
      root.render(element);
      const unmountFn = () => root.unmount();
      unmountFns.push(unmountFn);
      return unmountFn;
    };

    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-1",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
  });

  it('should mark render phase force updates for class component', () => {
    class Example extends React.Component {
      state = {didRender: false};
      render() {
        if (this.state.didRender === false) {
          this.forceUpdate(() => this.setState({didRender: true}));
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
        "--commit-stop",
      ]
    `);
  });

  // This test is coupled to lane implementation details, so I'm disabling it in
  // the new fork until it stabilizes so we don't have to repeatedly update it.
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
        "--commit-stop",
      ]
    `);
  });

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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
        "--react-internal-module-start-<filtered-file-system-path>",
        "--react-internal-module-stop-<filtered-file-system-path>",
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
          "--react-internal-module-start-<filtered-file-system-path>",
          "--react-internal-module-stop-<filtered-file-system-path>",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-1",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });

    it('regression test DefaultLane', () => {
      renderRootHelper(<div />);
      expect(clearedMarks).toMatchInlineSnapshot(`
          Array [
            "--schedule-render-16",
          ]
      `);
    });

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
          "--react-internal-module-start-<filtered-file-system-path>",
          "--react-internal-module-stop-<filtered-file-system-path>",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-1",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });

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
          "--react-internal-module-start-<filtered-file-system-path>",
          "--react-internal-module-stop-<filtered-file-system-path>",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-4",
          "--layout-effects-stop",
          "--commit-stop",
        ]
      `);
    });
  });
});
