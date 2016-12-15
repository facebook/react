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
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactTestUtils = require('ReactTestUtils');

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
        />
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
          <ClickCounter ref="myCounter" initialCount={1}/>
        </GeneralContainerComponent>
      </div>
    );
  }
}

/**
 * Render a TestRefsComponent and ensure that the main refs are wired up.
 */
var renderTestRefsComponent = function() {
  var testRefsComponent =
      ReactTestUtils.renderIntoDocument(<TestRefsComponent />);
  expect(testRefsComponent instanceof TestRefsComponent).toBe(true);

  var generalContainer = testRefsComponent.refs.myContainer;
  expect(generalContainer instanceof GeneralContainerComponent).toBe(true);

  var counter = testRefsComponent.refs.myCounter;
  expect(counter instanceof ClickCounter).toBe(true);

  return testRefsComponent;
};


var expectClickLogsLengthToBe = function(instance, length) {
  var clickLogs =
    ReactTestUtils.scryRenderedDOMComponentsWithClass(instance, 'clickLogDiv');
  expect(clickLogs.length).toBe(length);
  expect(Object.keys(instance.refs.myCounter.refs).length).toBe(length);
};

describe('reactiverefs', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  /**
   * Ensure that for every click log there is a corresponding ref (from the
   * perspective of the injected ClickCounter component.
   */
  it('Should increase refs with an increase in divs', () => {
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
describe('ref swapping', () => {
  let RefHopsAround;
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    RefHopsAround = class extends React.Component {
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
    };
  });

  it('Allow refs to hop around children correctly', () => {
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

  it('coerces numbers to strings', () => {
    class A extends React.Component {
      render() {
        return <div ref={1} />;
      }
    }
    const a = ReactTestUtils.renderIntoDocument(<A />);
    expect(a.refs[1].nodeName).toBe('DIV');
  });
});

describe('string refs between fiber and stack', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('attaches, detaches from fiber component with stack layer', () => {
    spyOn(console, 'error');
    const ReactCurrentOwner = require('ReactCurrentOwner');
    const ReactDOM = require('ReactDOM');
    const ReactDOMFiber = require('ReactDOMFiber');
    const ReactInstanceMap = require('ReactInstanceMap');
    let layerMounted = false;
    class A extends React.Component {
      render() {
        return <div />;
      }
      componentDidMount() {
        // ReactLayeredComponentMixin sets ReactCurrentOwner manually
        ReactCurrentOwner.current = ReactInstanceMap.get(this);
        const span = <span ref="span" />;
        ReactCurrentOwner.current = null;

        ReactDOM.unstable_renderSubtreeIntoContainer(
          this,
          span,
          this._container = document.createElement('div'),
          () => {
            expect(this.refs.span.nodeName).toBe('SPAN');
            layerMounted = true;
          }
        );
      }
      componentWillUnmount() {
        ReactDOM.unmountComponentAtNode(this._container);
      }
    }
    const container = document.createElement('div');
    const a = ReactDOMFiber.render(<A />, container);
    expect(a.refs.span).toBeTruthy();
    ReactDOMFiber.unmountComponentAtNode(container);
    expect(a.refs.span).toBe(undefined);
    expect(layerMounted).toBe(true);
    if (!ReactDOMFeatureFlags.useFiber) {
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: You are using React DOM Fiber which is an experimental ' +
        'renderer. It is likely to have bugs, breaking changes and is ' +
        'unsupported.'
      );
    }
  });

  it('attaches, detaches from stack component with fiber layer', () => {
    spyOn(console, 'error');
    const ReactCurrentOwner = require('ReactCurrentOwner');
    const ReactDOM = require('ReactDOM');
    const ReactDOMFiber = require('ReactDOMFiber');
    const ReactInstanceMap = require('ReactInstanceMap');
    let layerMounted = false;
    class A extends React.Component {
      render() {
        return <div />;
      }
      componentDidMount() {
        // ReactLayeredComponentMixin sets ReactCurrentOwner manually
        ReactCurrentOwner.current = ReactInstanceMap.get(this);
        const span = <span ref="span" />;
        ReactCurrentOwner.current = null;

        ReactDOMFiber.unstable_renderSubtreeIntoContainer(
          this,
          span,
          this._container = document.createElement('div'),
          () => {
            expect(this.refs.span.nodeName).toBe('SPAN');
            layerMounted = true;
          }
        );
      }
      componentWillUnmount() {
        ReactDOMFiber.unmountComponentAtNode(this._container);
      }
    }
    const container = document.createElement('div');
    const a = ReactDOM.render(<A />, container);
    expect(a.refs.span).toBeTruthy();
    ReactDOM.unmountComponentAtNode(container);
    expect(a.refs.span).toBe(undefined);
    expect(layerMounted).toBe(true);
    if (!ReactDOMFeatureFlags.useFiber) {
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: You are using React DOM Fiber which is an experimental ' +
        'renderer. It is likely to have bugs, breaking changes and is ' +
        'unsupported.'
      );
    }
  });
});
