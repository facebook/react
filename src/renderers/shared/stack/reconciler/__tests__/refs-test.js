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

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

var reactComponentExpect = require('reactComponentExpect');

/**
 * Counts clicks and has a renders an item for each click. Each item rendered
 * has a ref of the form "clickLogN".
 */
class ClickCounter extends React.Component {
  state = {count: this.props.initialCount};

  triggerReset = () => {
    this.setState({count: this.props.initialCount});
  };

  handleClick = () => {
    this.setState({count: this.state.count + 1});
  };

  render() {
    var children = [];
    var i;
    for (i = 0; i < this.state.count; i++) {
      children.push(
        <div
          className="clickLogDiv"
          key={'clickLog' + i}
          ref={'clickLog' + i}
        />,
      );
    }
    return (
      <span className="clickIncrementer" onClick={this.handleClick}>
        {children}
      </span>
    );
  }
}

/**
 * Only purpose is to test that refs are tracked even when applied to a
 * component that is injected down several layers. Ref systems are difficult to
 * build in such a way that ownership is maintained in an airtight manner.
 */
class GeneralContainerComponent extends React.Component {
  render() {
    return <div>{this.props.children}</div>;
  }
}

/**
 * Notice how refs ownership is maintained even when injecting a component
 * into a different parent.
 */
class TestRefsComponent extends React.Component {
  doReset = () => {
    this.refs.myCounter.triggerReset();
  };

  render() {
    return (
      <div>
        <div ref="resetDiv" onClick={this.doReset}>
          Reset Me By Clicking This.
        </div>
        <GeneralContainerComponent ref="myContainer">
          <ClickCounter ref="myCounter" initialCount={1} />
        </GeneralContainerComponent>
      </div>
    );
  }
}

/**
 * Render a TestRefsComponent and ensure that the main refs are wired up.
 */
var renderTestRefsComponent = function() {
  var testRefsComponent = ReactTestUtils.renderIntoDocument(
    <TestRefsComponent />,
  );

  reactComponentExpect(testRefsComponent).toBeCompositeComponentWithType(
    TestRefsComponent,
  );

  var generalContainer = testRefsComponent.refs.myContainer;
  var counter = testRefsComponent.refs.myCounter;

  reactComponentExpect(generalContainer).toBeCompositeComponentWithType(
    GeneralContainerComponent,
  );
  reactComponentExpect(counter).toBeCompositeComponentWithType(ClickCounter);

  return testRefsComponent;
};

var expectClickLogsLengthToBe = function(instance, length) {
  var clickLogs = ReactTestUtils.scryRenderedDOMComponentsWithClass(
    instance,
    'clickLogDiv',
  );
  expect(clickLogs.length).toBe(length);
  expect(Object.keys(instance.refs.myCounter.refs).length).toBe(length);
};

describe('reactiverefs', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
  });

  /**
   * Ensure that for every click log there is a corresponding ref (from the
   * perspective of the injected ClickCounter component.
   */
  it('Should increase refs with an increase in divs', () => {
    var testRefsComponent = renderTestRefsComponent();
    var clickIncrementer = ReactTestUtils.findRenderedDOMComponentWithClass(
      testRefsComponent,
      'clickIncrementer',
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
describe('ref swapping', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
  });

  class RefHopsAround extends React.Component {
    state = {count: 0};

    moveRef = () => {
      this.setState({count: this.state.count + 1});
    };

    render() {
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
  }

  it('Allow refs to hop around children correctly', () => {
    var refHopsAround = ReactTestUtils.renderIntoDocument(<RefHopsAround />);

    var firstDiv = ReactTestUtils.findRenderedDOMComponentWithClass(
      refHopsAround,
      'first',
    );
    var secondDiv = ReactTestUtils.findRenderedDOMComponentWithClass(
      refHopsAround,
      'second',
    );
    var thirdDiv = ReactTestUtils.findRenderedDOMComponentWithClass(
      refHopsAround,
      'third',
    );

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

  it('always has a value for this.refs', () => {
    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(!!instance.refs).toBe(true);
  });

  function testRefCall() {
    var refCalled = 0;
    function Inner(props) {
      return <a ref={props.saveA} />;
    }

    class Outer extends React.Component {
      saveA = () => {
        refCalled++;
      };

      componentDidMount() {
        this.setState({});
      }

      render() {
        return <Inner saveA={this.saveA} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Outer />);
    expect(refCalled).toBe(1);
  }

  it('ref called correctly for stateless component when __DEV__ = false', () => {
    var originalDev = __DEV__;
    __DEV__ = false;
    testRefCall();
    __DEV__ = originalDev;
  });

  it('ref called correctly for stateless component when __DEV__ = true', () => {
    var originalDev = __DEV__;
    __DEV__ = true;
    testRefCall();
    __DEV__ = originalDev;
  });
});

describe('creating element with ref in constructor', () => {
  class RefTest extends React.Component {
    constructor(props) {
      super(props);
      this.p = <p ref="p">Hello!</p>;
    }

    render() {
      return <div>{this.p}</div>;
    }
  }

  var devErrorMessage =
    'addComponentAsRefTo(...): Only a ReactOwner can have refs. You might ' +
    "be adding a ref to a component that was not created inside a component's " +
    '`render` method, or you have multiple copies of React loaded ' +
    '(details: https://fb.me/react-refs-must-have-owner).';

  var prodErrorMessage =
    'Minified React error #119; visit ' +
    'http://facebook.github.io/react/docs/error-decoder.html?invariant=119 for the full message ' +
    'or use the non-minified dev environment for full errors and additional helpful warnings.';

  var fiberDevErrorMessage =
    'Element ref was specified as a string (p) but no owner was ' +
    'set. You may have multiple copies of React loaded. ' +
    '(details: https://fb.me/react-refs-must-have-owner).';

  var fiberProdErrorMessage =
    'Minified React error #149; visit ' +
    'http://facebook.github.io/react/docs/error-decoder.html?invariant=149&args[]=p ' +
    'for the full message or use the non-minified dev environment for full errors and additional ' +
    'helpful warnings.';

  describe('when in development', () => {
    it('throws an error', () => {
      ReactTestUtils = require('ReactTestUtils');

      expect(function() {
        ReactTestUtils.renderIntoDocument(<RefTest />);
      }).toThrowError(
        ReactDOMFeatureFlags.useFiber ? fiberDevErrorMessage : devErrorMessage,
      );
    });
  });

  describe('when in production', () => {
    var oldProcess;

    beforeEach(() => {
      __DEV__ = false;

      // Mutating process.env.NODE_ENV would cause our babel plugins to do the
      // wrong thing. If you change this, make sure to test with jest --no-cache.
      oldProcess = process;
      global.process = {
        ...process,
        env: {...process.env, NODE_ENV: 'production'},
      };

      jest.resetModules();
      React = require('React');
      ReactTestUtils = require('ReactTestUtils');
      ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
      reactComponentExpect = require('reactComponentExpect');
    });

    afterEach(() => {
      __DEV__ = true;
      global.process = oldProcess;
    });

    it('throws an error', () => {
      expect(function() {
        ReactTestUtils.renderIntoDocument(<RefTest />);
      }).toThrowError(
        ReactDOMFeatureFlags.useFiber
          ? fiberProdErrorMessage
          : prodErrorMessage,
      );
    });
  });
});
