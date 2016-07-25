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

describe('ReactPerfDev', function() {
  var React;
  var ReactDOM;
  var ReactPerfDev;
  var ReactTestUtils;
  var emptyFunction;

  var App;
  var Box;
  var Div;
  var LifeCycle;

  beforeEach(function() {
    var now = 0;
    jest.setMock('fbjs/lib/performanceNow', function() {
      return now++;
    });

    if (typeof console.table !== 'function') {
      console.table = () => {};
      console.table.isFake = true;
    }

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactPerfDev = require('ReactPerfDev');
    ReactTestUtils = require('ReactTestUtils');
    emptyFunction = require('emptyFunction');

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

  afterEach(function() {
    if (console.table.isFake) {
      delete console.table;
    }
  });

  function measure(fn) {
    ReactPerfDev.start();
    fn();
    ReactPerfDev.stop();

    // Make sure none of the methods crash.
    ReactPerfDev.getWasted();
    ReactPerfDev.getInclusive();
    ReactPerfDev.getExclusive();
    ReactPerfDev.getOperations();

    return ReactPerfDev.getLastMeasurements();
  }

  it('should count no-op update as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);
    var measurements = measure(() => {
      ReactDOM.render(<App />, container);
    });

    var summary = ReactPerfDev.getWasted(measurements);
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

  it('should count no-op update in child as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);

    // Here, we add a Box -- two of the <Box /> updates are wasted time (but the
    // addition of the third is not)
    var measurements = measure(() => {
      ReactDOM.render(<App flipSecond={true} />, container);
    });

    var summary = ReactPerfDev.getWasted(measurements);
    expect(summary).toEqual([{
      key: 'App > Box',
      instanceCount: 1,
      inclusiveRenderDuration: 1,
      renderCount: 1,
    }]);
  });

  function expectNoWaste(fn) {
    var measurements = measure(fn);
    var summary = ReactPerfDev.getWasted(measurements);
    expect(summary).toEqual([]);
  }

  it('should not count initial render as waste', function() {
    expectNoWaste(() => {
      ReactTestUtils.renderIntoDocument(<App />);
    });
  });

  it('should not count unmount as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div>hello</Div>, container);
    expectNoWaste(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
  });

  it('should not count content update as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div>hello</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>hello world</Div>, container);
    });
  });

  it('should not count child addition as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div><span /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><span /><span /></Div>, container);
    });
  });

  it('should not count child removal as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div><span /><span /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><span /></Div>, container);
    });
  });

  it('should not count property update as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div className="yellow">hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div className="blue">hey</Div>, container);
    });
  });

  it('should not count style update as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div style={{color: 'yellow'}}>hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div style={{color: 'blue'}}>hey</Div>, container);
    });
  });

  it('should not count property removal as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div className="yellow">hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>hey</Div>, container);
    });
  });

  it('should not count raw HTML update as waste', function() {
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

  it('should not count child reordering as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div><div key="A" /><div key="B" /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><div key="B" /><div key="A" /></Div>, container);
    });
  });

  it('should not count text update as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div>{'hello'}{'world'}</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>{'hello'}{'friend'}</Div>, container);
    });
  });

  it('should not count replacing null with a host as waste', function() {
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

  it('should not count replacing a host with null as waste', function() {
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

  it('should include stats for components unmounted during measurement', function() {
    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Div><Div key="a" /></Div>, container);
      ReactDOM.render(<Div><Div key="b" /></Div>, container);
    });
    expect(ReactPerfDev.getExclusive(measurements)).toEqual([{
      key: 'Div',
      instanceCount: 3,
      counts: { ctor: 3, render: 4 },
      durations: { ctor: 3, render: 4 },
      totalDuration: 7,
    }]);
  });

  it('should include lifecycle methods in measurements', function() {
    var container = document.createElement('div');
    var measurements = measure(() => {
      var instance = ReactDOM.render(<LifeCycle />, container);
      ReactDOM.render(<LifeCycle />, container);
      instance.setState({});
      ReactDOM.unmountComponentAtNode(container);
    });
    expect(ReactPerfDev.getExclusive(measurements)).toEqual([{
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

  it('should include render time of functional components', function() {
    function Foo() {
      return null;
    }

    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Foo />, container);
    });
    expect(ReactPerfDev.getExclusive(measurements)).toEqual([{
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

  it('should not count time in a portal towards lifecycle method', function() {
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

    expect(ReactPerfDev.getExclusive(measurements)).toEqual([{
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

  it('warns once when using getMeasurementsSummaryMap', function() {
    var measurements = measure(() => {});
    spyOn(console, 'error');
    ReactPerfDev.getMeasurementsSummaryMap(measurements);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`ReactPerf.getMeasurementsSummaryMap(...)` is deprecated. Use ' +
      '`ReactPerf.getWasted(...)` instead.'
    );

    ReactPerfDev.getMeasurementsSummaryMap(measurements);
    expect(console.error.calls.count()).toBe(1);
  });

  it('warns once when using printDOM', function() {
    var measurements = measure(() => {});
    spyOn(console, 'error');
    ReactPerfDev.printDOM(measurements);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`ReactPerf.printDOM(...)` is deprecated. Use ' +
      '`ReactPerf.printOperations(...)` instead.'
    );

    ReactPerfDev.printDOM(measurements);
    expect(console.error.calls.count()).toBe(1);
  });

  it('returns isRunning state', () => {
    expect(ReactPerfDev.isRunning()).toBe(false);

    ReactPerfDev.start();
    expect(ReactPerfDev.isRunning()).toBe(true);

    ReactPerfDev.stop();
    expect(ReactPerfDev.isRunning()).toBe(false);
  });

  it('start has no effect when already running', () => {
    expect(ReactPerfDev.isRunning()).toBe(false);

    ReactPerfDev.start();
    expect(ReactPerfDev.isRunning()).toBe(true);

    ReactPerfDev.start();
    expect(ReactPerfDev.isRunning()).toBe(true);

    ReactPerfDev.stop();
    expect(ReactPerfDev.isRunning()).toBe(false);
  });

  it('stop has no effect when already stopped', () => {
    expect(ReactPerfDev.isRunning()).toBe(false);

    ReactPerfDev.stop();
    expect(ReactPerfDev.isRunning()).toBe(false);

    ReactPerfDev.stop();
    expect(ReactPerfDev.isRunning()).toBe(false);
  });

  it('should print console error only once', () => {
    __DEV__ = false;

    spyOn(console, 'error');

    expect(ReactPerfDev.getLastMeasurements()).toEqual([]);
    expect(ReactPerfDev.getExclusive()).toEqual([]);
    expect(ReactPerfDev.getInclusive()).toEqual([]);
    expect(ReactPerfDev.getWasted()).toEqual([]);
    expect(ReactPerfDev.getOperations()).toEqual([]);
    expect(ReactPerfDev.printExclusive()).toEqual(undefined);
    expect(ReactPerfDev.printInclusive()).toEqual(undefined);
    expect(ReactPerfDev.printWasted()).toEqual(undefined);
    expect(ReactPerfDev.printOperations()).toEqual(undefined);
    expect(ReactPerfDev.start()).toBe(undefined);
    expect(ReactPerfDev.stop()).toBe(undefined);
    expect(ReactPerfDev.isRunning()).toBe(false);

    expect(console.error.calls.count()).toBe(1);

    __DEV__ = true;
  });

  it('should work when measurement starts during reconciliation', () => {
    // https://github.com/facebook/react/issues/6949#issuecomment-230371009
    class Measurer extends React.Component {
      componentWillMount() {
        ReactPerfDev.start();
      }

      componentDidMount() {
        ReactPerfDev.stop();
      }

      componentWillUpdate() {
        ReactPerfDev.start();
      }

      componentDidUpdate() {
        ReactPerfDev.stop();
      }

      render() {
        // Force reconciliation despite constant element
        return React.cloneElement(this.props.children);
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Measurer><App /></Measurer>, container);
    expect(ReactPerfDev.getWasted()).toEqual([]);

    ReactDOM.render(<Measurer><App /></Measurer>, container);
    expect(ReactPerfDev.getWasted()).toEqual([{
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
});
