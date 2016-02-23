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
  let React;
  let ReactDOM;
  let ReactDefaultPerf;
  let ReactTestUtils;
  let ReactDefaultPerfAnalysis;

  let App;
  let Box;
  let Div;

  beforeEach(function() {
    let now = 0;
    jest.setMock('fbjs/lib/performanceNow', function() {
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
    const container = document.createElement('div');
    ReactDOM.render(<App />, container);
    const measurements = measure(() => {
      ReactDOM.render(<App />, container);
    });

    const summary = ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
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
    const container = document.createElement('div');
    ReactDOM.render(<App />, container);

    // Here, we add a Box -- two of the <Box /> updates are wasted time (but the
    // addition of the third is not)
    const measurements = measure(() => {
      ReactDOM.render(<App flipSecond={true} />, container);
    });

    const summary = ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
    expect(summary.length).toBe(1);

    /*eslint-disable dot-notation */

    expect(summary[0]['Owner > component']).toBe('App > Box');
    expect(summary[0]['Wasted time (ms)']).not.toBe(0);
    expect(summary[0]['Instances']).toBe(1);

    /*eslint-enable dot-notation */
  });

  function expectNoWaste(fn) {
    const measurements = measure(fn);
    const summary = ReactDefaultPerf.getMeasurementsSummaryMap(measurements);
    expect(summary).toEqual([]);
  }

  it('should not count initial render as waste', function() {
    expectNoWaste(() => {
      ReactTestUtils.renderIntoDocument(<App />);
    });
  });

  it('should not count unmount as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div>hello</Div>, container);
    expectNoWaste(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
  });

  it('should not count content update as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div>hello</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>hello world</Div>, container);
    });
  });

  it('should not count child addition as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div><span /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><span /><span /></Div>, container);
    });
  });

  it('should not count child removal as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div><span /><span /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><span /></Div>, container);
    });
  });

  it('should not count property update as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div className="yellow">hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div className="blue">hey</Div>, container);
    });
  });

  it('should not count style update as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div style={{color: 'yellow'}}>hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div style={{color: 'blue'}}>hey</Div>, container);
    });
  });

  it('should not count property removal as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div className="yellow">hey</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>hey</Div>, container);
    });
  });

  it('should not count raw HTML update as waste', function() {
    const container = document.createElement('div');
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
    const container = document.createElement('div');
    ReactDOM.render(<Div><div key="A" /><div key="B" /></Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div><div key="B" /><div key="A" /></Div>, container);
    });
  });

  it('should not count text update as waste', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div>{'hello'}{'world'}</Div>, container);
    expectNoWaste(() => {
      ReactDOM.render(<Div>{'hello'}{'friend'}</Div>, container);
    });
  });

  it('putListener should not be instrumented', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div onClick={function() {}}>hey</Div>, container);
    const measurements = measure(() => {
      ReactDOM.render(<Div onClick={function() {}}>hey</Div>, container);
    });

    const summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
    expect(summary).toEqual([]);
  });

  it('deleteListener should not be instrumented', function() {
    const container = document.createElement('div');
    ReactDOM.render(<Div onClick={function() {}}>hey</Div>, container);
    const measurements = measure(() => {
      ReactDOM.render(<Div>hey</Div>, container);
    });

    const summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
    expect(summary).toEqual([]);
  });

});
