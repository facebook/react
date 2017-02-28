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

var CSSCore = require('CSSCore');

var React;
var ReactDOM;
var ReactCSSTransitionGroup;

// Most of the real functionality is covered in other unit tests, this just
// makes sure we're wired up correctly.
describe('ReactCSSTransitionGroup', () => {
  var container;

  beforeEach(() => {
    jest.resetModules();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactCSSTransitionGroup = require('ReactCSSTransitionGroup');

    container = document.createElement('div');
    spyOn(console, 'error');
  });

  it('should warn if timeouts aren\'t specified', () => {
    ReactDOM.render(
      <ReactCSSTransitionGroup
        transitionName="yolo"
        transitionEnter={false}
        transitionLeave={true}
      >
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );

    // Warning about the missing transitionLeaveTimeout prop
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('should not warn if timeouts is zero', () => {
    ReactDOM.render(
      <ReactCSSTransitionGroup
        transitionName="yolo"
        transitionEnter={false}
        transitionLeave={true}
        transitionLeaveTimeout={0}
      >
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('should clean-up silently after the timeout elapses', () => {
    var a = ReactDOM.render(
      <ReactCSSTransitionGroup
        transitionName="yolo"
        transitionEnter={false}
        transitionLeaveTimeout={200}
      >
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);

    setTimeout.mock.calls.length = 0;

    ReactDOM.render(
      <ReactCSSTransitionGroup
        transitionName="yolo"
        transitionEnter={false}
        transitionLeaveTimeout={200}
      >
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(2);
    expect(ReactDOM.findDOMNode(a).childNodes[0].id).toBe('two');
    expect(ReactDOM.findDOMNode(a).childNodes[1].id).toBe('one');

    // For some reason jst is adding extra setTimeout()s and grunt test isn't,
    // so we need to do this disgusting hack.
    for (var i = 0; i < setTimeout.mock.calls.length; i++) {
      if (setTimeout.mock.calls[i][1] === 200) {
        setTimeout.mock.calls[i][0]();
        break;
      }
    }

    // No warnings
    expectDev(console.error.calls.count()).toBe(0);

    // The leaving child has been removed
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);
    expect(ReactDOM.findDOMNode(a).childNodes[0].id).toBe('two');
  });

  it('should keep both sets of DOM nodes around', () => {
    var a = ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);
    ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(2);
    expect(ReactDOM.findDOMNode(a).childNodes[0].id).toBe('two');
    expect(ReactDOM.findDOMNode(a).childNodes[1].id).toBe('one');
  });

  it('should switch transitionLeave from false to true', () => {
    var a = ReactDOM.render(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={false}>
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);
    ReactDOM.render(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={false}>
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);
    ReactDOM.render(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={true}>
        <span key="three" id="three" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(2);
    expect(ReactDOM.findDOMNode(a).childNodes[0].id).toBe('three');
    expect(ReactDOM.findDOMNode(a).childNodes[1].id).toBe('two');
  });

  it('should work with no children', () => {
    ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo" />,
      container
    );
  });

  it('should work with a null child', () => {
    ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        {[null]}
      </ReactCSSTransitionGroup>,
      container
    );
  });

  it('should transition from one to null', () => {
    var a = ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);
    ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        {null}
      </ReactCSSTransitionGroup>,
      container
    );
    // (Here, we expect the original child to stick around but test that no
    // exception is thrown)
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);
    expect(ReactDOM.findDOMNode(a).childNodes[0].id).toBe('one');
  });

  it('should transition from false to one', () => {
    var a = ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        {false}
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(0);
    ReactDOM.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);
    expect(ReactDOM.findDOMNode(a).childNodes[0].id).toBe('one');
  });

  it('should use transition-type specific names when they\'re provided', () => {
    var customTransitionNames = {
      enter: 'custom-entering',
      leave: 'custom-leaving',
    };

    var a = ReactDOM.render(
      <ReactCSSTransitionGroup
        transitionName={customTransitionNames}
        transitionEnterTimeout={1}
        transitionLeaveTimeout={1}
      >
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(1);

    // Add an element
    ReactDOM.render(
      <ReactCSSTransitionGroup
        transitionName={customTransitionNames}
        transitionEnterTimeout={1}
        transitionLeaveTimeout={1}
      >
        <span key="one" id="one" />
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(2);

    var enteringNode = ReactDOM.findDOMNode(a).childNodes[1];
    expect(CSSCore.hasClass(enteringNode, 'custom-entering')).toBe(true);

    // Remove an element
    ReactDOM.render(
      <ReactCSSTransitionGroup
        transitionName={customTransitionNames}
        transitionEnterTimeout={1}
        transitionLeaveTimeout={1}
      >
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(ReactDOM.findDOMNode(a).childNodes.length).toBe(2);

    var leavingNode = ReactDOM.findDOMNode(a).childNodes[0];
    expect(CSSCore.hasClass(leavingNode, 'custom-leaving')).toBe(true);
  });

  it('should clear transition timeouts when unmounted', () => {
    class Component extends React.Component {
      render() {
        return (
          <ReactCSSTransitionGroup
            transitionName="yolo"
            transitionEnterTimeout={500}>
            {this.props.children}
          </ReactCSSTransitionGroup>
        );
      }
    }

    ReactDOM.render(<Component />, container);
    ReactDOM.render(<Component><span key="yolo" id="yolo" /></Component>, container);

    ReactDOM.unmountComponentAtNode(container);

    // Testing that no exception is thrown here, as the timeout has been cleared.
    jest.runAllTimers();
  });

  it('should handle unmounted elements properly', () => {
    class Child extends React.Component {
      render() {
        if (!this.props.show) {
          return null;
        }
        return <div />;
      }
    }

    class Component extends React.Component {
      state = { showChild: true };

      componentDidMount() {
        this.setState({ showChild: false });
      }

      render() {
        return (
          <ReactCSSTransitionGroup
            transitionName="yolo"
            transitionAppear={true}
            transitionAppearTimeout={0}
          >
            <Child show={this.state.showChild} />
          </ReactCSSTransitionGroup>
        );
      }
    }

    ReactDOM.render(<Component />, container);

    // Testing that no exception is thrown here, as the timeout has been cleared.
    jest.runAllTimers();
  });
});
