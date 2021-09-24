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

describe('SchedulingProfiler', () => {
  let React;
  let ReactTestRenderer;
  let ReactNoop;
  let Scheduler;
  let act;

  let clearedMarks;
  let featureDetectionMarkName = null;
  let marks;

  function createUserTimingPolyfill() {
    featureDetectionMarkName = null;

    clearedMarks = [];
    marks = [];

    // This is not a true polyfill, but it gives us enough to capture marks.
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
    return {
      clearMarks(markName) {
        clearedMarks.push(markName);
        marks = marks.filter(mark => mark !== markName);
      },
      mark(markName, markOptions) {
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

  function getMarks() {
    return clearedMarks[0] === featureDetectionMarkName
      ? clearedMarks.slice(1)
      : clearedMarks;
  }

  beforeEach(() => {
    jest.resetModules();

    global.performance = createUserTimingPolyfill();

    React = require('react');

    // ReactNoop must be imported after ReactTestRenderer!
    ReactTestRenderer = require('react-test-renderer');
    ReactNoop = require('react-noop-renderer');

    Scheduler = require('scheduler');
    act = require('jest-react').act;
  });

  afterEach(() => {
    // Verify all logged marks also get cleared.
    expect(marks).toHaveLength(0);

    delete global.performance;
  });

  // @gate !enableSchedulingProfiler
  it('should not mark if enableSchedulingProfiler is false', () => {
    ReactTestRenderer.create(<div />);
    expect(getMarks()).toEqual([]);
  });

  it('should mark sync render without suspends or state updates', () => {
    ReactTestRenderer.create(<div />);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
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

  it('should mark concurrent render without suspends or state updates', () => {
    ReactTestRenderer.create(<div />, {unstable_isConcurrent: true});

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
    }
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

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(<Foo />);
      });

      // Do one step of work.
      expect(ReactNoop.flushNextYield()).toEqual(['Foo']);

      if (gate(flags => flags.enableSchedulingProfiler)) {
        expect(getMarks()).toMatchInlineSnapshot(`
        Array [
          "--schedule-render-64",
          "--render-start-64",
          "--component-render-start-Foo",
          "--component-render-stop",
          "--render-yield",
        ]
      `);
      }
    } else {
      ReactNoop.render(<Foo />);

      // Do one step of work.
      expect(ReactNoop.flushNextYield()).toEqual(['Foo']);

      if (gate(flags => flags.enableSchedulingProfiler)) {
        expect(getMarks()).toMatchInlineSnapshot(`
        Array []
      `);
      }
    }
  });

  it('should mark sync render with suspense that resolves', async () => {
    const fakeSuspensePromise = Promise.resolve(true);
    function Example() {
      throw fakeSuspensePromise;
    }

    ReactTestRenderer.create(
      <React.Suspense fallback={null}>
        <Example />
      </React.Suspense>,
    );

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-1",
        "--render-start-1",
        "--component-render-start-Example",
        "--component-render-stop",
        "--suspense-suspend-0-Example-mount-1",
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

    clearPendingMarks();

    await fakeSuspensePromise;
    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--suspense-resolved-0-Example",
      ]
    `);
    }
  });

  it('should mark sync render with suspense that rejects', async () => {
    const fakeSuspensePromise = Promise.reject(new Error('error'));
    function Example() {
      throw fakeSuspensePromise;
    }

    ReactTestRenderer.create(
      <React.Suspense fallback={null}>
        <Example />
      </React.Suspense>,
    );

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-1",
        "--render-start-1",
        "--component-render-start-Example",
        "--component-render-stop",
        "--suspense-suspend-0-Example-mount-1",
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

    clearPendingMarks();

    await expect(fakeSuspensePromise).rejects.toThrow();
    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--suspense-rejected-0-Example",
      ]
    `);
    }
  });

  it('should mark concurrent render with suspense that resolves', async () => {
    const fakeSuspensePromise = Promise.resolve(true);
    function Example() {
      throw fakeSuspensePromise;
    }

    ReactTestRenderer.create(
      <React.Suspense fallback={null}>
        <Example />
      </React.Suspense>,
      {unstable_isConcurrent: true},
    );

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--component-render-start-Example",
        "--component-render-stop",
        "--suspense-suspend-0-Example-mount-16",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
    }

    clearPendingMarks();

    await fakeSuspensePromise;
    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--suspense-resolved-0-Example",
      ]
    `);
    }
  });

  it('should mark concurrent render with suspense that rejects', async () => {
    const fakeSuspensePromise = Promise.reject(new Error('error'));
    function Example() {
      throw fakeSuspensePromise;
    }

    ReactTestRenderer.create(
      <React.Suspense fallback={null}>
        <Example />
      </React.Suspense>,
      {unstable_isConcurrent: true},
    );

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--component-render-start-Example",
        "--component-render-stop",
        "--suspense-suspend-0-Example-mount-16",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
    }

    clearPendingMarks();

    await expect(fakeSuspensePromise).rejects.toThrow();
    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--suspense-rejected-0-Example",
      ]
    `);
    }
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

    ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--schedule-state-update-1-Example",
        "--layout-effects-stop",
        "--render-start-1",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-1",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
        "--commit-stop",
      ]
    `);
    }
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

    ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--schedule-forced-update-1-Example",
        "--layout-effects-stop",
        "--render-start-1",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-1",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
        "--commit-stop",
      ]
    `);
    }
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

    ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--component-render-start-Example",
        "--schedule-state-update-16-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
    }
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

    ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--component-render-start-Example",
        "--schedule-forced-update-16-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
    }
  });

  it('should mark cascading layout updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--render-start-16",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--schedule-state-update-1-Example",
        "--layout-effects-stop",
        "--render-start-1",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-1",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
        "--commit-stop",
      ]
    `);
    }
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

    act(() => {
      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});
    });

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
        "--render-start-16",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
        "--passive-effects-start-16",
        "--schedule-state-update-16-Example",
        "--passive-effects-stop",
        "--render-start-16",
        "--component-render-start-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
      ]
    `);
    }
  });

  it('should mark render phase updates', () => {
    function Example() {
      const [didRender, setDidRender] = React.useState(false);
      if (!didRender) {
        setDidRender(true);
      }
      return didRender;
    }

    act(() => {
      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});
    });

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
        "--render-start-16",
        "--component-render-start-Example",
        "--schedule-state-update-16-Example",
        "--component-render-stop",
        "--render-stop",
        "--commit-start-16",
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--layout-effects-start-16",
        "--layout-effects-stop",
        "--commit-stop",
      ]
    `);
    }
  });

  it('should mark sync render that throws', async () => {
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

    ReactTestRenderer.create(
      <ErrorBoundary>
        <ExampleThatThrows />
      </ErrorBoundary>,
    );

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
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
        "--react-version-17.0.3",
        "--profiler-version-1",
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
        "--react-version-17.0.3",
        "--profiler-version-1",
        "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
        "--commit-stop",
      ]
    `);
    }
  });

  it('should mark concurrent render that throws', async () => {
    spyOnProd(console, 'error');

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

    ReactTestRenderer.create(
      <ErrorBoundary>
        <ExampleThatThrows />
      </ErrorBoundary>,
      {unstable_isConcurrent: true},
    );

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
      Array [
        "--schedule-render-16",
      ]
    `);
    }

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    if (gate(flags => flags.enableSchedulingProfiler)) {
      expect(getMarks()).toMatchInlineSnapshot(`
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
          "--react-version-17.0.3",
          "--profiler-version-1",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--layout-effects-start-16",
          "--schedule-state-update-1-ErrorBoundary",
          "--layout-effects-stop",
          "--render-start-1",
          "--component-render-start-ErrorBoundary",
          "--component-render-stop",
          "--render-stop",
          "--commit-start-1",
          "--react-version-17.0.3",
          "--profiler-version-1",
          "--react-lane-labels-Sync,InputContinuousHydration,InputContinuous,DefaultHydration,Default,TransitionHydration,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Transition,Retry,Retry,Retry,Retry,Retry,SelectiveHydration,IdleHydration,Idle,Offscreen",
          "--commit-stop",
          "--commit-stop",
        ]
      `);
    }
  });
});
