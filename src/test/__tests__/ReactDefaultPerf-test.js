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

describe('ReactDefaultPerf', function() {
  var React;
  var ReactDOM;
  var ReactDOMFeatureFlags;
  var ReactDefaultPerf;
  var ReactTestUtils;
  var ReactDefaultPerfAnalysis;

  var App;
  var Box;
  var Div;

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
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
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

  afterEach(function() {
    if (console.table.isFake) {
      delete console.table;
    }
  });

  function measure(fn) {
    ReactDefaultPerf.start();
    fn();
    ReactDefaultPerf.stop();
    return ReactDefaultPerf.getLastMeasurements().__unstable_this_format_will_change;
  }

  it('should count no-op update as waste', function() {
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);
    var measurements = measure(() => {
      ReactDOM.render(<App />, container);
    });

    var summary = ReactDefaultPerf.getWasted(measurements);
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

    var summary = ReactDefaultPerf.getWasted(measurements);
    expect(summary.length).toBe(1);

    /*eslint-disable dot-notation */

    expect(summary[0]['Owner > component']).toBe('App > Box');
    expect(summary[0]['Wasted time (ms)']).not.toBe(0);
    expect(summary[0]['Instances']).toBe(1);

    /*eslint-enable dot-notation */
  });

  function expectNoWaste(fn) {
    var measurements = measure(fn);
    var summary = ReactDefaultPerf.getWasted(measurements);
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

  it('should print a table after calling printOperations', function() {
    var container = document.createElement('div');
    var measurements = measure(() => {
      ReactDOM.render(<Div>hey</Div>, container);
    });
    spyOn(console, 'table');
    ReactDefaultPerf.printOperations(measurements);
    expect(console.table.calls.length).toBe(1);
    expect(console.table.argsForCall[0][0]).toEqual([{
      'data-reactid': '',
      type: 'set innerHTML',
      args: ReactDOMFeatureFlags.useCreateElement ?
        '{"node":"<not serializable>","children":[],"html":null,"text":null}' :
        '"<div data-reactroot=\\"\\" data-reactid=\\"1\\">hey</div>"',
    }]);
  });

  it('warns once when using getMeasurementsSummaryMap', function() {
    var measurements = measure(() => {});
    spyOn(console, 'error');
    ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      '`ReactPerf.getMeasurementsSummaryMap(...)` is deprecated. Use ' +
      '`ReactPerf.getWasted(...)` instead.'
    );

    ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
    expect(console.error.calls.length).toBe(1);
  });

  it('warns once when using printDOM', function() {
    var measurements = measure(() => {});
    spyOn(console, 'error');
    ReactDefaultPerf.printDOM(measurements);
    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      '`ReactPerf.printDOM(...)` is deprecated. Use ' +
      '`ReactPerf.printOperations(...)` instead.'
    );

    ReactDefaultPerf.printDOM(measurements);
    expect(console.error.calls.length).toBe(1);
  });

});
