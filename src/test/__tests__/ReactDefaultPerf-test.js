/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDefaultPerf', function() {
  var React;
  var ReactDOM;
  var ReactDefaultPerf;
  var ReactTestUtils;
  var ReactDefaultPerfAnalysis;

  var App;
  var Box;
  var Div;

  beforeEach(function() {
    var now = 0;
    jest.setMock('performanceNow', function() {
      return now++;
    });

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDefaultPerf = require('ReactDefaultPerf');
    ReactTestUtils = require('ReactTestUtils');
    ReactDefaultPerfAnalysis = require('ReactDefaultPerfAnalysis');

    App = React.createClass({
      render: function() {
        return <div><Box /><Box flip={this.props.flipSecond} /></div>;
      },
    });

    Box = React.createClass({
      render: function() {
        return <div key={!!this.props.flip}><input /></div>;
      },
    });

    // ReactPerf only measures composites, so we put everything in one.
    Div = React.createClass({
      render: function() {
        return <div {...this.props} />;
      },
    });
  });

  function measure(fn) {
    ReactDefaultPerf.start();
    fn();
    ReactDefaultPerf.stop();
    return ReactDefaultPerf.getLastMeasurements();
  }

  it('should count no-op update as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);
    var measurements = measure(() => {
      ReactDOM.render(<App />, container);
    });

    var summary = ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
    expect(summary.length).toBe(2);

    /*eslint-disable dot-notation */

    expect(summary[0]['Owner > component']).toBe('<root> > App');
    expect(summary[0]['Wasted time (ms)']).not.toBe(0);
    expect(summary[0]['Instances']).toBe(1);

    expect(summary[1]['Owner > component']).toBe('App > Box');
    expect(summary[1]['Wasted time (ms)']).not.toBe(0);
    expect(summary[1]['Instances']).toBe(2);

    /*eslint-enable dot-notation */
  });

  it('should count no-op update in child as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);

    // Here, we add a Box -- two of the <Box /> updates are wasted time (but the
    // addition of the third is not)
    var measurements = measure(() => {
      ReactDOM.render(<App flipSecond={true} />, container);
    });

    var summary = ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
    expect(summary.length).toBe(1);

    /*eslint-disable dot-notation */

    expect(summary[0]['Owner > component']).toBe('App > Box');
    expect(summary[0]['Wasted time (ms)']).not.toBe(0);
    expect(summary[0]['Instances']).toBe(1);

    /*eslint-enable dot-notation */
  });

  function expectNoWaste(fn) {
    var measurements = measure(fn);
    var summary = ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
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

  it('putListener should not be instrumented', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div onClick={function() {}}>hey</Div>, container);
    var measurements = measure(() => {
      ReactDOM.render(<Div onClick={function() {}}>hey</Div>, container);
    });

    var summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
    expect(summary).toEqual([]);
  });

  it('deleteListener should not be instrumented', function() {
    var container = document.createElement('div');
    ReactDOM.render(<Div onClick={function() {}}>hey</Div>, container);
    var measurements = measure(() => {
      ReactDOM.render(<Div>hey</Div>, container);
    });

    var summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
    expect(summary).toEqual([]);
  });

  it('should track component lifecycles for 1 setState cycle', function() {
    var Parent = React.createClass({
      // use counter to provide limit on setState calls
      getInitialState: function() {
        return {
          count: 0,
        };
      },
      shouldComponentUpdate: function(nextProps, nextState) {
        if (nextState.count <= 2) {
          return true;
        }
        return false;
      },
      // after initial mount, call set state to cause re-render
      // to invoke shouldComponentUpdate above
      componentDidMount: function() {
        this.setState({
          count: this.state.count += 1,
        });
      },
      render: function() {
        return <div><Child key="child-1" /><Child key="child-2" /></div>;
      },
    });

    var Child = React.createClass({
      shouldComponentUpdate: function() {
        return true;
      },
      render: function() {
        return <div><input /></div>;
      },
    });

    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Parent key="parent-node" />, container);
    });

    var components = measurements[measurements.length - 1].components;
    var ids = Object.keys(components);
    // last entry of measurements should have object with key for parent, 2 children
    expect(ids.length).toBe(3);
    var parent = ids[0];
    var child1 = ids[1];
    var child2 = ids[2];
    // 1st entry should be parent and have didMount and shouldUpdate
    expect(components[parent].shouldComponentUpdate.count).toBe(1);
    expect(components[parent].componentDidMount.count).toBe(1);
    // 2nd and 3rd entries are for children that have shouldUpdate
    expect(components[child1].shouldComponentUpdate.count).toBe(1);
    expect(components[child1].shouldComponentUpdate.count).toBe(1);
    expect(components[child2].shouldComponentUpdate.count).toBe(1);
    expect(components[child2].shouldComponentUpdate.count).toBe(1);
  });

  it('should track component lifecycles for multiple setState cycles', function() {
    var Parent = React.createClass({
      // use counter to provide limit on setState calls
      getInitialState: function() {
        return {
          count: 0,
        };
      },
      shouldComponentUpdate: function(nextProps, nextState) {
        if (nextState.count <= 2) {
          return true;
        }
        return false;
      },
      // after initial mount, call set state to cause re-render
      // to invoke shouldComponentUpdate above
      componentDidMount: function() {
        this.setState({
          count: this.state.count += 1,
        });
      },
      componentDidUpdate: function() {
        this.setState({
          count: this.state.count += 1,
        });
      },
      render: function() {
        return <div><Child key="child-1" /><Child key="child-2" /></div>;
      },
    });

    var Child = React.createClass({
      // use counter to provide limit on setState calls
      getInitialState: function() {
        return {
          count: 0,
        };
      },
      shouldComponentUpdate: function(nextProps, nextState) {
        if (nextState.count <= 2) {
          return true;
        }
        return false;
      },
      componentDidUpdate: function() {
        this.setState({
          count: this.state.count += 1,
        });
      },
      render: function() {
        return <div><input /></div>;
      },
    });

    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Parent key="parent-node"/>, container);
    });

    var components = measurements[measurements.length - 1].components;
    var ids = Object.keys(components);
    // last entry of measurements should have object with key for parent, 2 children
    expect(ids.length).toBe(3);
    var parent = ids[0];
    var child1 = ids[1];
    var child2 = ids[2];
    // 1st entry should be parent and have didMount, shouldUpdate, didUpdate
    expect(components[parent].shouldComponentUpdate.count).toBe(2);
    expect(components[parent].componentDidMount.count).toBe(1);
    expect(components[parent].componentDidUpdate.count).toBe(1);
    // children that have shouldUpdate 3x: 2 from parent, 1 from didUpdate
    expect(components[child1].shouldComponentUpdate.count).toBe(3);
    expect(components[child2].shouldComponentUpdate.count).toBe(3);
    // children that have didUpdate 2x: 3rd update causes internal count
    // to be > 2 and return false from shouldUpdate
    expect(components[child1].componentDidUpdate.count).toBe(2);
    expect(components[child2].componentDidUpdate.count).toBe(2);
  });

  it('should flatten summary for lifecycles', function() {
    var Parent = React.createClass({
      // use counter to provide limit on setState calls
      getInitialState: function() {
        return {
          count: 0,
        };
      },
      shouldComponentUpdate: function(nextProps, nextState) {
        if (nextState.count <= 2) {
          return true;
        }
        return false;
      },
      // after initial mount, call set state to cause re-render
      // to invoke shouldComponentUpdate above
      componentDidMount: function() {
        this.setState({
          count: this.state.count += 1,
        });
      },
      render: function() {
        return <div><Child key="child-1" /><Child key="child-2" /></div>;
      },
    });

    var Child = React.createClass({
      shouldComponentUpdate: function() {
        return true;
      },
      render: function() {
        return <div><input /></div>;
      },
    });

    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Parent key="parent-node"/>, container);
    });

    var summary = ReactDefaultPerf.getLifecyclesSummaryMap(measurements);
    expect(summary.length).toBe(3);
    // parent has id, shouldUpdate, didMount
    expect(summary[0].id).not.toBe(null);
    expect(summary[0].shouldComponentUpdate).not.toBe(null);
    expect(summary[0].componentDidMount).not.toBe(null);
    // children just have id, shouldUpdate
    expect(summary[1].id).not.toBe(null);
    expect(summary[1].shouldComponentUpdate).not.toBe(null);
    expect(summary[2].id).not.toBe(null);
    expect(summary[2].shouldComponentUpdate).not.toBe(null);
  });
});
