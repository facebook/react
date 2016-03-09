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

var React;
var ReactDOM;
var ReactTestUtils;

var TestComponent;

describe('refs-destruction', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');

    TestComponent = React.createClass({
      render: function() {
        return (
          <div>
            {this.props.destroy ? null :
              <div ref="theInnerDiv">
                Lets try to destroy this.
              </div>
            }
          </div>
        );
      },
    });
  });

  it('should remove refs when destroying the parent', function() {
    var container = document.createElement('div');
    var testInstance = ReactDOM.render(<TestComponent />, container);
    expect(ReactTestUtils.isDOMComponent(testInstance.refs.theInnerDiv))
      .toBe(true);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    ReactDOM.unmountComponentAtNode(container);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });

  it('should remove refs when destroying the child', function() {
    var container = document.createElement('div');
    var testInstance = ReactDOM.render(<TestComponent />, container);
    expect(ReactTestUtils.isDOMComponent(testInstance.refs.theInnerDiv))
      .toBe(true);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    ReactDOM.render(<TestComponent destroy={true} />, container);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });

  it('should not error when destroying child with ref asynchronously', function() {
    var Modal = React.createClass({
      componentDidMount: function() {
        this.div = document.createElement('div');
        document.body.appendChild(this.div);
        this.componentDidUpdate();
      },
      componentDidUpdate: function() {
        ReactDOM.render(<div>{this.props.children}</div>, this.div);
      },
      componentWillUnmount: function() {
        var self = this;
        // some async animation
        setTimeout(function() {
          expect(function() {
            ReactDOM.unmountComponentAtNode(self.div);
          }).not.toThrow();
          document.body.removeChild(self.div);
        }, 0);
      },
      render() {
        return null;
      },
    });
    var AppModal = React.createClass({
      render: function() {
        return (<Modal>
          <a ref="ref"/>
        </Modal>);
      },
    });
    var App = React.createClass({
      render: function() {
        return this.props.hidden ? null : <AppModal onClose={this.close}/>;
      },
    });
    var container = document.createElement('div');
    ReactDOM.render(<App />, container);
    ReactDOM.render(<App hidden={true}/>, container);
    jest.runAllTimers();
  });
});
