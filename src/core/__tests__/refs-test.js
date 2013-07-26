/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');

var reactComponentExpect= require('reactComponentExpect');


/**
 * Counts clicks and has a renders an item for each click. Each item rendered
 * has a ref of the form "clickLogN".
 */
var ClickCounter = React.createClass({
  getInitialState: function() {
    return {count: this.props.initialCount};
  },
  triggerReset: function() {
    this.setState({count: this.props.initialCount});
  },
  handleClick: function() {
    this.setState({count: this.state.count + 1});
  },
  render: function() {
    var children = [];
    var i;
    for (i=0; i < this.state.count; i++) {
      children.push(
        <div
          className="clickLogDiv"
          key={"clickLog" + i}
          ref={"clickLog" + i}
        />
      );
    }
    return (
      <span className="clickIncrementer" onClick={this.handleClick}>
        {children}
      </span>
    );
  }
});

/**
 * Only purpose is to test that refs are tracked even when applied to a
 * component that is injected down several layers. Ref systems are difficult to
 * build in such a way that ownership is maintained in an airtight manner.
 */
var GeneralContainerComponent = React.createClass({
  render: function() {
    return <div> {this.props.children} </div>;
  }
});

/**
 * Notice how refs ownership is maintained even when injecting a component
 * into a different parent.
 */
var TestRefsComponent = React.createClass({
  doReset: function() {
    this.refs.myCounter.triggerReset();
  },
  render: function() {
    return (
      <div>
        <div ref="resetDiv" onClick={this.doReset}>
          Reset Me By Clicking This.
        </div>
        <GeneralContainerComponent ref="myContainer">
          <ClickCounter ref="myCounter" initialCount={1}/>
        </GeneralContainerComponent>
      </div>
    );
  }
});

/**
 * Render a TestRefsComponent and ensure that the main refs are wired up.
 */
var renderTestRefsComponent = function() {
  var testRefsComponent =
      ReactTestUtils.renderIntoDocument(<TestRefsComponent />);

  reactComponentExpect(testRefsComponent)
      .toBeCompositeComponentWithType(TestRefsComponent);

  var generalContainer = testRefsComponent.refs.myContainer;
  var counter = testRefsComponent.refs.myCounter;

  reactComponentExpect(generalContainer)
      .toBeCompositeComponentWithType(GeneralContainerComponent);
  reactComponentExpect(counter)
      .toBeCompositeComponentWithType(ClickCounter);

  return testRefsComponent;
};


var expectClickLogsLengthToBe = function(instance, length) {
  var clickLogs =
    ReactTestUtils.scryRenderedDOMComponentsWithClass(instance, 'clickLogDiv');
  expect(clickLogs.length).toBe(length);
  expect(Object.keys(instance.refs.myCounter.refs).length).toBe(length);
};

describe('reactiverefs', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  /**
   * Ensure that for every click log there is a corresponding ref (from the
   * perspective of the injected ClickCounter component.
   */
  it("Should increase refs with an increase in divs", function() {
    var testRefsComponent = renderTestRefsComponent();
    var clickIncrementer =
      ReactTestUtils.findRenderedDOMComponentWithClass(
        testRefsComponent,
        'clickIncrementer'
      );

    expectClickLogsLengthToBe(testRefsComponent, 1);

    // After clicking the reset, there should still only be one click log ref.
    ReactTestUtils.Simulate.click(testRefsComponent.refs.resetDiv);
    expectClickLogsLengthToBe(testRefsComponent, 1);

    // Begin incrementing clicks (and therefore refs).
    ReactTestUtils.Simulate.click(clickIncrementer);
    expectClickLogsLengthToBe(testRefsComponent, 2);

    ReactTestUtils.Simulate.click(clickIncrementer);
    expectClickLogsLengthToBe(testRefsComponent, 3);

    // Now reset again
    ReactTestUtils.Simulate.click(testRefsComponent.refs.resetDiv);
    expectClickLogsLengthToBe(testRefsComponent, 1);

  });

});



/**
 * Tests that when a ref hops around children, we can track that correctly.
 */
describe('ref swapping', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  var RefHopsAround = React.createClass({
    getInitialState: function() {
      return {count: 0};
    },
    moveRef: function() {
      this.setState({ count: this.state.count + 1 });
    },
    render: function() {
      var count = this.state.count;
      /**
       * What we have here, is three divs with refs (div1/2/3), but a single
       * moving cursor ref `hopRef` that "hops" around the three. We'll call the
       * `moveRef()` function several times and make sure that the hop ref
       * points to the correct divs.
       */
      return (
        <div>
          <div
            className="first"
            ref={count % 3 === 0 ? 'hopRef' : 'divOneRef'}
          />
          <div
            className="second"
            ref={count % 3 === 1 ? 'hopRef' : 'divTwoRef'}
          />
          <div
            className="third"
            ref={count % 3 === 2 ? 'hopRef' : 'divThreeRef'}
          />
        </div>
      );
    }
  });

  it("Allow refs to hop around children correctly", function() {
    var refHopsAround = ReactTestUtils.renderIntoDocument(<RefHopsAround />);

    var firstDiv =
      ReactTestUtils.findRenderedDOMComponentWithClass(refHopsAround, 'first');
    var secondDiv =
      ReactTestUtils.findRenderedDOMComponentWithClass(refHopsAround, 'second');
    var thirdDiv =
      ReactTestUtils.findRenderedDOMComponentWithClass(refHopsAround, 'third');

    expect(refHopsAround.refs.hopRef).toEqual(firstDiv);
    expect(refHopsAround.refs.divTwoRef).toEqual(secondDiv);
    expect(refHopsAround.refs.divThreeRef).toEqual(thirdDiv);

    refHopsAround.moveRef();
    expect(refHopsAround.refs.divOneRef).toEqual(firstDiv);
    expect(refHopsAround.refs.hopRef).toEqual(secondDiv);
    expect(refHopsAround.refs.divThreeRef).toEqual(thirdDiv);

    refHopsAround.moveRef();
    expect(refHopsAround.refs.divOneRef).toEqual(firstDiv);
    expect(refHopsAround.refs.divTwoRef).toEqual(secondDiv);
    expect(refHopsAround.refs.hopRef).toEqual(thirdDiv);

    /**
     * Make sure that after the third, we're back to where we started and the
     * refs are completely restored.
     */
    refHopsAround.moveRef();
    expect(refHopsAround.refs.hopRef).toEqual(firstDiv);
    expect(refHopsAround.refs.divTwoRef).toEqual(secondDiv);
    expect(refHopsAround.refs.divThreeRef).toEqual(thirdDiv);
  });
});

