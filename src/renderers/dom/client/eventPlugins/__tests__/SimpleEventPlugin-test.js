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

describe('SimpleEventPlugin', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should fire transitionend events', function() {
    var called = false;

    var TransTest = React.createClass({
      getInitialState() {
        return {
          color: 'black',
        };
      },

      onClick() {
        this.setState({
          color: (this.state.color === 'red') ? 'black' : 'red',
        });
      },

      onTransitionEnd(e) {
        called = true;
        expect(e.type).toBe('transitionend');
        expect(e.propertyName).toBe('color');
        expect(e.elapsedTime).toBeDefined();
      },

      render() {
        var style = {
          color: this.state.color,
          transition: 'all 1ms linear',
        };

        return (
          <div onClick={this.onClick} onTransitionEnd={this.onTransitionEnd} style={style}>Foo</div>
        );
      },
    });

    var container = document.createElement('div');

    ReactDOM.render(<TransTest />, container);

    ReactTestUtils.Simulate.click(container.childNodes[0]);

    expect(called).toBe(true);
  });
});
