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

// This test is *.internal so that it can import this shared file.
import ReactVersion from 'shared/ReactVersion';

// Hard-coding because importing will not work with bundle tests and to
// avoid leaking exports for lanes that are only imported in this test.
const ReactFiberLane = {
  SyncLane: /*        */ 0b0000000000000000000000000000001,
  DefaultLane: /*     */ 0b0000000000000000000000000010000,
  TransitionLane1: /* */ 0b0000000000000000000000001000000,
};

describe('SchedulingProfiler', () => {
  let React;
  let ReactTestRenderer;
  let ReactNoop;
  let Scheduler;

  let clearedMarks;
  let featureDetectionMarkName = null;
  let formatLanes;
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

  function expectMarksToContain(expectedMarks) {
    expect(clearedMarks).toContain(expectedMarks);
  }

  function expectMarksToEqual(expectedMarks) {
    expect(
      clearedMarks[0] === featureDetectionMarkName
        ? clearedMarks.slice(1)
        : clearedMarks,
    ).toEqual(expectedMarks);
  }

  beforeEach(() => {
    jest.resetModules();

    global.performance = createUserTimingPolyfill();

    React = require('react');

    // ReactNoop must be imported after ReactTestRenderer!
    ReactTestRenderer = require('react-test-renderer');
    ReactNoop = require('react-noop-renderer');

    Scheduler = require('scheduler');

    const SchedulingProfiler = require('react-reconciler/src/SchedulingProfiler');
    formatLanes = SchedulingProfiler.formatLanes;
  });

  afterEach(() => {
    // Verify all logged marks also get cleared.
    expect(marks).toHaveLength(0);

    delete global.performance;
  });

  // @gate !enableSchedulingProfiler
  it('should not mark if enableSchedulingProfiler is false', () => {
    ReactTestRenderer.create(<div />);
    expectMarksToEqual([]);
  });

  // @gate enableSchedulingProfiler
  it('should log React version on initialization', () => {
    expectMarksToEqual([`--react-init-${ReactVersion}`]);
  });

  // @gate enableSchedulingProfiler
  it('should mark sync render without suspends or state updates', () => {
    ReactTestRenderer.create(<div />);

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.SyncLane)}`,
      `--render-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--layout-effects-stop',
      '--commit-stop',
    ]);
  });

  // @gate enableSchedulingProfiler
  it('should mark concurrent render without suspends or state updates', () => {
    ReactTestRenderer.create(<div />, {unstable_isConcurrent: true});

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--layout-effects-stop',
      '--commit-stop',
    ]);
  });

  // @gate enableSchedulingProfiler
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

      expectMarksToEqual([
        `--react-init-${ReactVersion}`,
        `--schedule-render-${formatLanes(ReactFiberLane.TransitionLane1)}`,
        `--render-start-${formatLanes(ReactFiberLane.TransitionLane1)}`,
        '--render-yield',
      ]);
    } else {
      ReactNoop.render(<Foo />);

      // Do one step of work.
      expect(ReactNoop.flushNextYield()).toEqual(['Foo']);

      expectMarksToEqual([
        `--react-init-${ReactVersion}`,
        `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
        `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
        '--render-yield',
      ]);
    }
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.SyncLane)}`,
      `--render-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--suspense-suspend-0-Example',
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--layout-effects-stop',
      '--commit-stop',
    ]);

    clearPendingMarks();

    await fakeSuspensePromise;
    expectMarksToEqual(['--suspense-resolved-0-Example']);
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.SyncLane)}`,
      `--render-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--suspense-suspend-0-Example',
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--layout-effects-stop',
      '--commit-stop',
    ]);

    clearPendingMarks();

    await expect(fakeSuspensePromise).rejects.toThrow();
    expectMarksToEqual(['--suspense-rejected-0-Example']);
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--suspense-suspend-0-Example',
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--layout-effects-stop',
      '--commit-stop',
    ]);

    clearPendingMarks();

    await fakeSuspensePromise;
    expectMarksToEqual(['--suspense-resolved-0-Example']);
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--suspense-suspend-0-Example',
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--layout-effects-stop',
      '--commit-stop',
    ]);

    clearPendingMarks();

    await expect(fakeSuspensePromise).rejects.toThrow();
    expectMarksToEqual(['--suspense-rejected-0-Example']);
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--schedule-state-update-${formatLanes(ReactFiberLane.SyncLane)}-Example`,
      '--layout-effects-stop',
      `--render-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--commit-stop',
      '--commit-stop',
    ]);
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--schedule-forced-update-${formatLanes(
        ReactFiberLane.SyncLane,
      )}-Example`,
      '--layout-effects-stop',
      `--render-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--commit-stop',
      '--commit-stop',
    ]);
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    expectMarksToContain(
      `--schedule-state-update-${formatLanes(
        ReactFiberLane.DefaultLane,
      )}-Example`,
    );
  });

  // @gate enableSchedulingProfiler
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

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    expectMarksToContain(
      `--schedule-forced-update-${formatLanes(
        ReactFiberLane.DefaultLane,
      )}-Example`,
    );
  });

  // @gate enableSchedulingProfiler
  it('should mark cascading layout updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--schedule-state-update-${formatLanes(ReactFiberLane.SyncLane)}-Example`,
      '--layout-effects-stop',
      `--render-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.SyncLane)}`,
      '--commit-stop',
      '--commit-stop',
    ]);
  });

  // This test is coupled to lane implementation details, so I'm disabling it in
  // the new fork until it stabilizes so we don't have to repeatedly update it.
  // @gate enableSchedulingProfiler
  it('should mark cascading passive updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.unstable_concurrentAct(() => {
      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});
    });

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      `--schedule-render-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--layout-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--layout-effects-stop',
      '--commit-stop',
      `--passive-effects-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      `--schedule-state-update-${formatLanes(
        ReactFiberLane.DefaultLane,
      )}-Example`,
      '--passive-effects-stop',
      `--render-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--render-stop',
      `--commit-start-${formatLanes(ReactFiberLane.DefaultLane)}`,
      '--commit-stop',
    ]);
  });

  // @gate enableSchedulingProfiler
  it('should mark render phase updates', () => {
    function Example() {
      const [didRender, setDidRender] = React.useState(false);
      if (!didRender) {
        setDidRender(true);
      }
      return didRender;
    }

    ReactTestRenderer.unstable_concurrentAct(() => {
      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});
    });

    expectMarksToContain(
      `--schedule-state-update-${formatLanes(
        ReactFiberLane.DefaultLane,
      )}-Example`,
    );
  });
});
