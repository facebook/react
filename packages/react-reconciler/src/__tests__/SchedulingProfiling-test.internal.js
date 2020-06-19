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

function normalizeCodeLocInfo(str) {
  return (
    str &&
    str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function(m, name) {
      return '\n    in ' + name + ' (at **)';
    })
  );
}

describe('SchedulingProfiling', () => {
  let React;
  let ReactTestRenderer;
  let ReactNoop;
  let Scheduler;

  let marks;

  function createUserTimingPolyfill() {
    // This is not a true polyfill, but it gives us enough to capture marks.
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
    return {
      mark(markName) {
        marks.push(markName);
      },
    };
  }

  beforeEach(() => {
    jest.resetModules();
    global.performance = createUserTimingPolyfill();

    React = require('react');

    // ReactNoop must be imported after ReactTestRenderer!
    ReactTestRenderer = require('react-test-renderer');
    ReactNoop = require('react-noop-renderer');

    Scheduler = require('scheduler');

    marks = [];
  });

  afterEach(() => {
    delete global.performance;
  });

  // @gate experimental && !enableSchedulingProfiling
  it('should not mark if enableSchedulingProfiling is false', () => {
    ReactTestRenderer.create(<div />);
    expect(marks).toEqual([]);
  });

  // @gate experimental && enableSchedulingProfiling
  it('should mark sync render without suspends or state updates', () => {
    ReactTestRenderer.create(<div />);

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000000000000001-',
      '--render-start-0b0000000000000000000000000000001',
      '--render-stop',
      // '--commit-start-0b0000000000000000000000000000001',
      // '--layout-effects-start-0b0000000000000000000000000000001',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
  it('should mark concurrent render without suspends or state updates', () => {
    ReactTestRenderer.create(<div />, {unstable_isConcurrent: true});

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(marks).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
      '--render-start-0b0000000000000000000001000000000',
      '--render-yield',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000000000000001-',
      '--render-start-0b0000000000000000000000000000001',
      '--suspense-suspend-Example-0-\n    at Example\n    at Suspense',
      '--render-stop',
      // '--commit-start-0b0000000000000000000000000000001',
      // '--layout-effects-start-0b0000000000000000000000000000001',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);

    marks.splice(0);

    await fakeSuspensePromise;
    expect(marks).toEqual([
      '--suspense-resolved-Example-0-\n    at Example\n    at Suspense',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000000000000001-',
      '--render-start-0b0000000000000000000000000000001',
      '--suspense-suspend-Example-0-\n    at Example\n    at Suspense',
      '--render-stop',
      // '--commit-start-0b0000000000000000000000000000001',
      // '--layout-effects-start-0b0000000000000000000000000000001',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);

    marks.splice(0);

    await expect(fakeSuspensePromise).rejects.toThrow();
    expect(marks).toEqual([
      '--suspense-rejected-Example-0-\n    at Example\n    at Suspense',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(marks).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--suspense-suspend-Example-0-\n    at Example\n    at Suspense',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);

    marks.splice(0);

    await fakeSuspensePromise;
    expect(marks).toEqual([
      '--suspense-resolved-Example-0-\n    at Example\n    at Suspense',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(marks).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--suspense-suspend-Example-0-\n    at Example\n    at Suspense',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);

    marks.splice(0);

    await expect(fakeSuspensePromise).rejects.toThrow();
    expect(marks).toEqual([
      '--suspense-rejected-Example-0-\n    at Example\n    at Suspense',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(marks.map(normalizeCodeLocInfo)).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      '--schedule-state-update-Example-0b0000000000000000000000000000001-\n    in Example (at **)',
      // '--layout-effects-stop',
      '--render-start-0b0000000000000000000000000000001',
      '--render-stop',
      // '--commit-start-0b0000000000000000000000000000001',
      // '--commit-stop',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(marks.map(normalizeCodeLocInfo)).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      '--schedule-forced-update-Example-0b0000000000000000000000000000001-\n    in Example (at **)',
      // '--layout-effects-stop',
      '--render-start-0b0000000000000000000000000000001',
      '--render-stop',
      // '--commit-start-0b0000000000000000000000000000001',
      // '--commit-stop',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    expect(marks.map(normalizeCodeLocInfo)).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--render-cancel',
      '--schedule-state-update-Example-0b0000000000000000000010000000000-\n    in Example (at **)',
      '--render-cancel',
      '--schedule-state-update-Example-0b0000000000000000000010000000000-\n    in Example (at **)',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
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

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    expect(marks.map(normalizeCodeLocInfo)).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--render-cancel',
      '--schedule-forced-update-Example-0b0000000000000000000010000000000-\n    in Example (at **)',
      '--render-cancel',
      '--schedule-forced-update-Example-0b0000000000000000000010000000000-\n    in Example (at **)',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
  it('should mark cascading layout updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

    expect(marks).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
    ]);

    marks.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(marks.map(normalizeCodeLocInfo)).toEqual([
      '--render-start-0b0000000000000000000001000000000',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      '--schedule-state-update-Example-0b0000000000000000000000000000001-\n    in Example (at **)',
      // '--layout-effects-stop',
      '--render-start-0b0000000000000000000000000000001',
      '--render-stop',
      // '--commit-start-0b0000000000000000000000000000001',
      // '--commit-stop',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
  it('should mark cascading passive updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});
    });
    expect(marks.map(normalizeCodeLocInfo)).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
      '--render-start-0b0000000000000000000001000000000',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      // '--layout-effects-stop',
      // '--commit-stop',
      // '--passive-effects-start-0b0000000000000000000001000000000',
      '--schedule-state-update-Example-0b0000000000000000000010000000000-\n    in Example (at **)',
      // '--passive-effects-stop',
      '--render-start-0b0000000000000000000010000000000',
      '--render-stop',
      // '--commit-start-0b0000000000000000000010000000000',
      // '--commit-stop',
    ]);
  });

  // @gate experimental && enableSchedulingProfiling
  it('should mark render phase updates', () => {
    function Example() {
      const [didRender, setDidRender] = React.useState(false);
      if (!didRender) {
        setDidRender(true);
      }
      return didRender;
    }

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});
    });
    expect(marks.map(normalizeCodeLocInfo)).toEqual([
      '--schedule-render-Unknown-0b0000000000000000000001000000000-',
      '--render-start-0b0000000000000000000001000000000',
      '--schedule-state-update-Example-0b0000000000000000000010000000000-\n    in Example (at **)',
      '--schedule-state-update-Example-0b0000000000000000000010000000000-\n    in Example (at **)',
      '--render-stop',
      // '--commit-start-0b0000000000000000000001000000000',
      // '--layout-effects-start-0b0000000000000000000001000000000',
      // '--layout-effects-stop',
      // '--commit-stop',
    ]);
  });
});
