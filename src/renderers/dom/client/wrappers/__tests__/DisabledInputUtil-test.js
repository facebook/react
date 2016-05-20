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


describe('DisabledInputUtils', function() {
  var React;
  var ReactDOM;
  var ReactTestUtils;

  var elements = ['button', 'input', 'select', 'textarea'];

  function expectClickThru(element) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(element));
    expect(onClick.mock.calls.length).toBe(1);
  }

  function expectNoClickThru(element) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(element));
    expect(onClick.mock.calls.length).toBe(0);
  }

  function mounted(element) {
    element = ReactTestUtils.renderIntoDocument(element);
    return element;
  }

  var onClick = jest.fn();

  elements.forEach(function(tagName) {

    describe(tagName, function() {

      beforeEach(function() {
        React = require('React');
        ReactDOM = require('ReactDOM');
        ReactTestUtils = require('ReactTestUtils');
      });

      it('should forward clicks when it starts out not disabled', function() {
        var element = React.createElement(tagName, {
          onClick: onClick,
        });

        expectClickThru(mounted(element));
      });

      it('should not forward clicks when it starts out disabled', function() {
        var element = React.createElement(tagName, {
          onClick: onClick,
          disabled: true,
        });

        expectNoClickThru(mounted(element));
      });

      it('should forward clicks when it becomes not disabled', function() {
        var container = document.createElement('div');
        var element = ReactDOM.render(
          React.createElement(tagName, { onClick: onClick, disabled: true }),
          container
        );
        element = ReactDOM.render(
          React.createElement(tagName, { onClick: onClick }),
          container
        );
        expectClickThru(element);
      });

      it('should not forward clicks when it becomes disabled', function() {
        var container = document.createElement('div');
        var element = ReactDOM.render(
          React.createElement(tagName, { onClick: onClick }),
          container
        );
        element = ReactDOM.render(
          React.createElement(tagName, { onClick: onClick, disabled: true }),
          container
        );
        expectNoClickThru(element);
      });

      it('should work correctly if the listener is changed', function() {
        var container = document.createElement('div');
        var element = ReactDOM.render(
          React.createElement(tagName, { onClick: onClick, disabled: true }),
          container
        );
        element = ReactDOM.render(
          React.createElement(tagName, { onClick: onClick, disabled: false }),
          container
        );
        expectClickThru(element);
      });
    });
  });
});
