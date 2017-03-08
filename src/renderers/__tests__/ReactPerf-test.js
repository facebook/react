/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var describeStack = ReactDOMFeatureFlags.useFiber ? describe.skip : describe;

// ReactPerf is currently not supported on Fiber.
// Use browser timeline integration instead.
describeStack('ReactPerf', () => {
  var React;
  var ReactDOM;
  var ReactPerf;
  var ReactTestUtils;
  var emptyFunction;

  var App;
  var Box;
  var Div;
  var LifeCycle;

  beforeEach(() => {
    var now = 0;
    jest.setMock('fbjs/lib/performanceNow', function() {
      return now++;
    });

    if (typeof console.table !== 'function') {
      console.table = () => {};
      console.table.isFake = true;
    }

    React = require('react');
    ReactDOM = require('react-dom');
    ReactPerf = require('react-dom/lib/ReactPerf');
    ReactTestUtils = require('ReactTestUtils');
    emptyFunction = require('fbjs/lib/emptyFunction');

    App = class extends React.Component {
      render() {
        return <div><Box /><Box flip={this.props.flipSecond} /></div>;
      }
    };

    Box = class extends React.Component {
      render() {
        return <div key={!!this.props.flip}><input /></div>;
      }
    };

    // ReactPerf only measures composites, so we put everything in one.
    Div = class extends React.Component {
      render() {
        return <div {...this.props} />;
      }
    };

    LifeCycle = React.createClass({
      shouldComponentUpdate: emptyFunction.thatReturnsTrue,
      componentWillMount: emptyFunction,
      componentDidMount: emptyFunction,
      componentWillReceiveProps: emptyFunction,
      componentWillUpdate: emptyFunction,
      componentDidUpdate: emptyFunction,
      componentWillUnmount: emptyFunction,
      render: emptyFunction.thatReturnsNull,
    });
  });

  afterEach(() => {
    if (console.table.isFake) {
      delete console.table;
    }
  });

  function measure(fn) {
    ReactPerf.start();
    fn();
    ReactPerf.stop();

    // Make sure none of the methods crash.
    ReactPerf.getWasted();
    ReactPerf.getInclusive();
    ReactPerf.getExclusive();
    ReactPerf.getOperations();

    return ReactPerf.getLastMeasurements();
  }

  it('should count no-op update as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);
    var measurements = measure(() => {
      ReactDOM.render(<App />, container);
    });

    var summary = ReactPerf.getWasted(measurements);
    expect(summary).toEqual([{
      key: 'App',
      instanceCount: 1,
      inclusiveRenderDuration: 3,
      renderCount: 1,
    }, {
      key: 'App > Box',
      instanceCount: 2,
      inclusiveRenderDuration: 2,
      renderCount: 2,
    }]);
  });

  it('should count no-op update in child as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);

    // Here, we add a Box -- two of the <Box /> updates are wasted time (but the
    // addition of the third is not)
    var measurements = measure(() => {
      ReactDOM.render(<App flipSecond={true} />, container);
    });

    var summary = ReactPerf.getWasted(measurements);
    expect(summary).toEqual([{
      key: 'App > Box',
      instanceCount: 1,
      inclusiveRenderDuration: 1,
      renderCount: 1,
    }]);
  });

  function expectNoWaste(fn) {
    var measurements = measure(fn);
    var summary = ReactPerf.getWasted(measurements);
    expect(summary).toEqual([]);
  }

  it('should not count initial render as waste', () => {
    expectNoWaste(() => {
      ReactTestUtils.renderIntoDocument(<App />);
    });
  });

  it('should not count unmount as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div>hello</Div>, container);
    expectNoWaste(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
  });

  it('should not count content update as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div>hello</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>hello world</Div>, container);
    });
  });

  it('should not count child addition as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div><span /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><span /><span /></Div>, container);
    });
  });

  it('should not count child removal as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div><span /><span /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><span /></Div>, container);
    });
  });

  it('should not count property update as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div className="yellow">hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div className="blue">hey</Div>, container);
    });
  });

  it('should not count style update as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div style={{color: 'yellow'}}>hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div style={{color: 'blue'}}>hey</Div>, container);
    });
  });

  it('should not count property removal as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div className="yellow">hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>hey</Div>, container);
    });
  });

  it('should not count raw HTML update as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <Div dangerouslySetInnerHTML={{__html: 'me'}} />,
      container
    );
    expectNoWaste(() => {
      ReactDOM.render(
        <Div dangerouslySetInnerHTML={{__html: 'you'}} />,
        container
      );
    });
  });

  it('should not count child reordering as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div><div key="A" /><div key="B" /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><div key="B" /><div key="A" /></Div>, container);
    });
  });

  it('should not count text update as waste', () => {
    var container = document.createElement('div');
    ReactDOM.render(<Div>{'hello'}{'world'}</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>{'hello'}{'friend'}</Div>, container);
    });
  });

  it('should not count replacing null with a host as waste', () => {
    var element = null;
    function Foo() {
      return element;
    }
    var container = document.createElement('div');
    ReactDOM.render(<Foo />, container);
    expectNoWaste(() => {
      element = <div />;
      ReactDOM.render(<Foo />, container);
    });
  });

  it('should not count replacing a host with null as waste', () => {
    var element = <div />;
    function Foo() {
      return element;
    }
    var container = document.createElement('div');
    ReactDOM.render(<Foo />, container);
    expectNoWaste(() => {
      element = null;
      ReactDOM.render(<Foo />, container);
    });
  });

  it('should include stats for components unmounted during measurement', () => {
    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Div><Div key="a" /></Div>, container);
      ReactDOM.render(<Div><Div key="b" /></Div>, container);
    });
    expect(ReactPerf.getExclusive(measurements)).toEqual([{
      key: 'Div',
      instanceCount: 3,
      counts: { ctor: 3, render: 4 },
      durations: { ctor: 3, render: 4 },
      totalDuration: 7,
    }]);
  });

  it('should include lifecycle methods in measurements', () => {
    var container = document.createElement('div');
    var measurements = measure(() => {
      var instance = ReactDOM.render(<LifeCycle />, container);
      ReactDOM.render(<LifeCycle />, container);
      instance.setState({});
      ReactDOM.unmountComponentAtNode(container);
    });
    expect(ReactPerf.getExclusive(measurements)).toEqual([{
      key: 'LifeCycle',
      instanceCount: 1,
      totalDuration: 14,
      counts: {
        ctor: 1,
        shouldComponentUpdate: 2,
        componentWillMount: 1,
        componentDidMount: 1,
        componentWillReceiveProps: 1,
        componentWillUpdate: 2,
        componentDidUpdate: 2,
        componentWillUnmount: 1,
        render: 3,
      },
      durations: {
        ctor: 1,
        shouldComponentUpdate: 2,
        componentWillMount: 1,
        componentDidMount: 1,
        componentWillReceiveProps: 1,
        componentWillUpdate: 2,
        componentDidUpdate: 2,
        componentWillUnmount: 1,
        render: 3,
      },
    }]);
  });

  it('should include render time of functional components', () => {
    function Foo() {
      return null;
    }

    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Foo />, container);
    });
    expect(ReactPerf.getExclusive(measurements)).toEqual([{
      key: 'Foo',
      instanceCount: 1,
      totalDuration: 1,
      counts: {
        render: 1,
      },
      durations: {
        render: 1,
      },
    }]);
  });

  it('should not count time in a portal towards lifecycle method', () => {
    function Foo() {
      return null;
    }

    var portalContainer = document.createElement('div');
    class Portal extends React.Component {
      componentDidMount() {
        ReactDOM.render(<Foo />, portalContainer);
      }
      render() {
        return null;
      }
    }

    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Portal />, container);
    });

    expect(ReactPerf.getExclusive(measurements)).toEqual([{
      key: 'Portal',
      instanceCount: 1,
      totalDuration: 6,
      counts: {
        ctor: 1,
        componentDidMount: 1,
        render: 1,
      },
      durations: {
        ctor: 1,
        // We want to exclude nested imperative ReactDOM.render() from lifecycle hook's own time.
        // Otherwise it would artificially float to the top even though its exclusive time is small.
        // This is how we get 4 as a number with the performanceNow() mock:
        // - we capture the time we enter componentDidMount (n = 0)
        // - we capture the time when we enter a nested flush (n = 1)
        // - in the nested flush, we call it twice: before and after <Foo /> rendering. (n = 3)
        // - we capture the time when we exit a nested flush (n = 4)
        // - we capture the time we exit componentDidMount (n = 5)
        // Time spent in componentDidMount = (5 - 0 - (4 - 3)) = 4.
        componentDidMount: 4,
        render: 1,
      },
    }, {
      key: 'Foo',
      instanceCount: 1,
      totalDuration: 1,
      counts: {
        render: 1,
      },
      durations: {
        render: 1,
      },
    }]);
  });

  it('warns once when using getMeasurementsSummaryMap', () => {
    var measurements = measure(() => {});
    spyOn(console, 'error');
    ReactPerf.getMeasurementsSummaryMap(measurements);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      '`ReactPerf.getMeasurementsSummaryMap(...)` is deprecated. Use ' +
      '`ReactPerf.getWasted(...)` instead.'
    );

    ReactPerf.getMeasurementsSummaryMap(measurements);
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('warns once when using printDOM', () => {
    var measurements = measure(() => {});
    spyOn(console, 'error');
    ReactPerf.printDOM(measurements);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      '`ReactPerf.printDOM(...)` is deprecated. Use ' +
      '`ReactPerf.printOperations(...)` instead.'
    );

    ReactPerf.printDOM(measurements);
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('returns isRunning state', () => {
    expect(ReactPerf.isRunning()).toBe(false);

    ReactPerf.start();
    expect(ReactPerf.isRunning()).toBe(true);

    ReactPerf.stop();
    expect(ReactPerf.isRunning()).toBe(false);
  });

  it('start has no effect when already running', () => {
    expect(ReactPerf.isRunning()).toBe(false);

    ReactPerf.start();
    expect(ReactPerf.isRunning()).toBe(true);

    ReactPerf.start();
    expect(ReactPerf.isRunning()).toBe(true);

    ReactPerf.stop();
    expect(ReactPerf.isRunning()).toBe(false);
  });

  it('stop has no effect when already stopped', () => {
    expect(ReactPerf.isRunning()).toBe(false);

    ReactPerf.stop();
    expect(ReactPerf.isRunning()).toBe(false);

    ReactPerf.stop();
    expect(ReactPerf.isRunning()).toBe(false);
  });

  it('should print console error only once', () => {
    __DEV__ = false;

    spyOn(console, 'error');

    expect(ReactPerf.getLastMeasurements()).toEqual([]);
    expect(ReactPerf.getExclusive()).toEqual([]);
    expect(ReactPerf.getInclusive()).toEqual([]);
    expect(ReactPerf.getWasted()).toEqual([]);
    expect(ReactPerf.getOperations()).toEqual([]);
    expect(ReactPerf.printExclusive()).toEqual(undefined);
    expect(ReactPerf.printInclusive()).toEqual(undefined);
    expect(ReactPerf.printWasted()).toEqual(undefined);
    expect(ReactPerf.printOperations()).toEqual(undefined);
    expect(ReactPerf.start()).toBe(undefined);
    expect(ReactPerf.stop()).toBe(undefined);
    expect(ReactPerf.isRunning()).toBe(false);

    expectDev(console.error.calls.count()).toBe(1);

    __DEV__ = true;
  });

  it('should work when measurement starts during reconciliation', () => {
    // https://github.com/facebook/react/issues/6949#issuecomment-230371009
    class Measurer extends React.Component {
      componentWillMount() {
        ReactPerf.start();
      }

      componentDidMount() {
        ReactPerf.stop();
      }

      componentWillUpdate() {
        ReactPerf.start();
      }

      componentDidUpdate() {
        ReactPerf.stop();
      }

      render() {
        // Force reconciliation despite constant element
        return React.cloneElement(this.props.children);
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Measurer><App /></Measurer>, container);
    expect(ReactPerf.getWasted()).toEqual([]);

    ReactDOM.render(<Measurer><App /></Measurer>, container);
    expect(ReactPerf.getWasted()).toEqual([{
      key: 'Measurer',
      instanceCount: 1,
      inclusiveRenderDuration: 4,
      renderCount: 1,
    }, {
      key: 'App',
      instanceCount: 1,
      inclusiveRenderDuration: 3,
      renderCount: 1,
    }, {
      key: 'App > Box',
      instanceCount: 2,
      inclusiveRenderDuration: 2,
      renderCount: 2,
    }]);
  });

  it('should not print errant warnings if render() throws', () => {
    var container = document.createElement('div');
    var thrownErr = new Error('Muhaha!');

    class Evil extends React.Component {
      render() {
        throw thrownErr;
      }
    }

    ReactPerf.start();
    try {
      ReactDOM.render(
        <div>
          <LifeCycle />
          <Evil />
        </div>,
        container
      );
    } catch (err) {
      if (err !== thrownErr) {
        throw err;
      }
    }
    ReactPerf.stop();
  });

  it('should not print errant warnings if componentWillMount() throws', () => {
    var container = document.createElement('div');
    var thrownErr = new Error('Muhaha!');

    class Evil extends React.Component {
      componentWillMount() {
        throw thrownErr;
      }
      render() {
        return <div />;
      }
    }

    ReactPerf.start();
    try {
      ReactDOM.render(
        <div>
          <LifeCycle />
          <Evil />
        </div>,
        container
      );
    } catch (err) {
      if (err !== thrownErr) {
        throw err;
      }
    }
    ReactPerf.stop();
  });

  it('should not print errant warnings if componentDidMount() throws', () => {
    var container = document.createElement('div');
    var thrownErr = new Error('Muhaha!');

    class Evil extends React.Component {
      componentDidMount() {
        throw thrownErr;
      }
      render() {
        return <div />;
      }
    }

    ReactPerf.start();
    try {
      ReactDOM.render(
        <div>
          <LifeCycle />
          <Evil />
        </div>,
        container
      );
    } catch (err) {
      if (err !== thrownErr) {
        throw err;
      }
    }
    ReactPerf.stop();
  });

  it('should not print errant warnings if portal throws in render()', () => {
    var container = document.createElement('div');
    var thrownErr = new Error('Muhaha!');

    class Evil extends React.Component {
      render() {
        throw thrownErr;
      }
    }
    class EvilPortal extends React.Component {
      componentDidMount() {
        var portalContainer = document.createElement('div');
        ReactDOM.render(<Evil />, portalContainer);
      }
      render() {
        return <div />;
      }
    }

    ReactPerf.start();
    try {
      ReactDOM.render(
        <div>
          <LifeCycle />
          <EvilPortal />
        </div>,
        container
      );
    } catch (err) {
      if (err !== thrownErr) {
        throw err;
      }
    }
    ReactDOM.unmountComponentAtNode(container);
    ReactPerf.stop();
  });

  it('should not print errant warnings if portal throws in componentWillMount()', () => {
    var container = document.createElement('div');
    var thrownErr = new Error('Muhaha!');

    class Evil extends React.Component {
      componentWillMount() {
        throw thrownErr;
      }
      render() {
        return <div />;
      }
    }
    class EvilPortal extends React.Component {
      componentWillMount() {
        var portalContainer = document.createElement('div');
        ReactDOM.render(<Evil />, portalContainer);
      }
      render() {
        return <div />;
      }
    }

    ReactPerf.start();
    try {
      ReactDOM.render(
        <div>
          <LifeCycle />
          <EvilPortal />
        </div>,
        container
      );
    } catch (err) {
      if (err !== thrownErr) {
        throw err;
      }
    }
    ReactDOM.unmountComponentAtNode(container);
    ReactPerf.stop();
  });

  it('should not print errant warnings if portal throws in componentDidMount()', () => {
    var container = document.createElement('div');
    var thrownErr = new Error('Muhaha!');

    class Evil extends React.Component {
      componentDidMount() {
        throw thrownErr;
      }
      render() {
        return <div />;
      }
    }
    class EvilPortal extends React.Component {
      componentDidMount() {
        var portalContainer = document.createElement('div');
        ReactDOM.render(<Evil />, portalContainer);
      }
      render() {
        return <div />;
      }
    }

    ReactPerf.start();
    try {
      ReactDOM.render(
        <div>
          <LifeCycle />
          <EvilPortal />
        </div>,
        container
      );
    } catch (err) {
      if (err !== thrownErr) {
        throw err;
      }
    }
    ReactDOM.unmountComponentAtNode(container);
    ReactPerf.stop();
  });
});
