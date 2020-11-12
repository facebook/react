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

import ReactVersion from 'shared/ReactVersion';

describe('SchedulingProfiler', () => {
  let React;
  let ReactTestRenderer;
  let ReactNoop;
  let Scheduler;

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
      '--schedule-render-1',
      '--render-start-1',
      '--render-stop',
      '--commit-start-1',
      '--layout-effects-start-1',
      '--layout-effects-stop',
      '--commit-stop',
    ]);
  });

  // @gate enableSchedulingProfiler
  it('should mark concurrent render without suspends or state updates', () => {
    ReactTestRenderer.create(<div />, {unstable_isConcurrent: true});

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      '--render-start-512',
      '--render-stop',
      '--commit-start-512',
      '--layout-effects-start-512',
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

    ReactNoop.render(<Foo />);
    // Do one step of work.
    expect(ReactNoop.flushNextYield()).toEqual(['Foo']);

    expectMarksToEqual([
      `--react-init-${ReactVersion}`,
      '--schedule-render-512',
      '--render-start-512',
      '--render-yield',
    ]);
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
      '--schedule-render-1',
      '--render-start-1',
      '--suspense-suspend-0-Example',
      '--render-stop',
      '--commit-start-1',
      '--layout-effects-start-1',
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
      '--schedule-render-1',
      '--render-start-1',
      '--suspense-suspend-0-Example',
      '--render-stop',
      '--commit-start-1',
      '--layout-effects-start-1',
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
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      '--render-start-512',
      '--suspense-suspend-0-Example',
      '--render-stop',
      '--commit-start-512',
      '--layout-effects-start-512',
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
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      '--render-start-512',
      '--suspense-suspend-0-Example',
      '--render-stop',
      '--commit-start-512',
      '--layout-effects-start-512',
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
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      '--render-start-512',
      '--render-stop',
      '--commit-start-512',
      '--layout-effects-start-512',
      '--schedule-state-update-1-Example',
      '--layout-effects-stop',
      '--render-start-1',
      '--render-stop',
      '--commit-start-1',
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
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      '--render-start-512',
      '--render-stop',
      '--commit-start-512',
      '--layout-effects-start-512',
      '--schedule-forced-update-1-Example',
      '--layout-effects-stop',
      '--render-start-1',
      '--render-stop',
      '--commit-start-1',
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
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    gate(({old}) =>
      old
        ? expectMarksToContain('--schedule-state-update-1024-Example')
        : expectMarksToContain('--schedule-state-update-512-Example'),
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
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    gate(({old}) =>
      old
        ? expectMarksToContain('--schedule-forced-update-1024-Example')
        : expectMarksToContain('--schedule-forced-update-512-Example'),
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
      '--schedule-render-512',
    ]);

    clearPendingMarks();

    expect(Scheduler).toFlushUntilNextPaint([]);

    expectMarksToEqual([
      '--render-start-512',
      '--render-stop',
      '--commit-start-512',
      '--layout-effects-start-512',
      '--schedule-state-update-1-Example',
      '--layout-effects-stop',
      '--render-start-1',
      '--render-stop',
      '--commit-start-1',
      '--commit-stop',
      '--commit-stop',
    ]);
  });

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
      '--schedule-render-512',
      '--render-start-512',
      '--render-stop',
      '--commit-start-512',
      '--layout-effects-start-512',
      '--layout-effects-stop',
      '--commit-stop',
      '--passive-effects-start-512',
      '--schedule-state-update-1024-Example',
      '--passive-effects-stop',
      '--render-start-1024',
      '--render-stop',
      '--commit-start-1024',
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

    gate(({old}) =>
      old
        ? expectMarksToContain('--schedule-state-update-1024-Example')
        : expectMarksToContain('--schedule-state-update-512-Example'),
    );
  });
});
