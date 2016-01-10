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

describe('TransitionEventPlugin', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should fire transitionend events', function() {
    var startOrder = [];
    var endOrder = [];

    var TransTest = React.createClass({
      getInitialState() {
        return {
          color: 'black',
          background: '#fff',
          padding: 10,
        };
      },

      onClick() {
        this.setState({
          color: 'red',
          background: '#000',
          padding: 15,
        });
      },

      onTransitionStart(e) {
        expect(e.type).toBe('transitionstart');
        startOrder.push(e.propertyName);
        // console.log('onTransitionStart', e.type, e.propertyName, e.elapsedTime);
      },

      onTransitionEnd(e) {
        expect(e.type).toBe('transitionend');
        endOrder.push(e.propertyName);
        // console.log('onTransitionEnd', e.type, e.propertyName, e.elapsedTime);
      },

      onTransitionCancel(e) {
        expect(e.type).toBe('transitioncancel');
        // console.log('onTransitionCancel', e.type, e.propertyName, e.elapsedTime);
      },

      render() {
        var style = this.state;
        style.transition = 'color 100ms linear, background 1s ease, padding .5s';

        return (
          <div
            className="trans-test"
            onClick={this.onClick}
            onTransitionStart={this.onTransitionStart}
            onTransitionEnd={this.onTransitionEnd}
            onTransitionCancel={this.onTransitionCancel}
            style={style}>
              Foo
          </div>
        );
      },
    });

    var container = document.createElement('div');

    ReactDOM.render(<TransTest />, container);

    ReactTestUtils.Simulate.click(container.childNodes[0]);

    jest.runAllTimers();

    expect(startOrder).toEqual(['background-color', 'background', 'color', 'padding']);
    expect(endOrder).toEqual(['color', 'padding', 'background-color', 'background']);
  });
});
