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


describe('SimpleEventPlugin', function() {
  var React;
  var ReactDOM;
  var ReactTestUtils;

  var onClick = jest.fn();

  function expectClickThru(element) {
    onClick.mockClear();
    ReactTestUtils.SimulateNative.click(ReactDOM.findDOMNode(element));
    expect(onClick.mock.calls.length).toBe(1);
  }

  function expectNoClickThru(element) {
    onClick.mockClear();
    ReactTestUtils.SimulateNative.click(ReactDOM.findDOMNode(element));
    expect(onClick.mock.calls.length).toBe(0);
  }

  function mounted(element) {
    element = ReactTestUtils.renderIntoDocument(element);
    return element;
  }

  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('A non-interactive tags click when disabled', function() {
    var element = (<div onClick={ onClick } />);
    expectClickThru(mounted(element));
  });

  it('A non-interactive tags clicks bubble when disabled', function() {
    var element = ReactTestUtils.renderIntoDocument(
      <div onClick={onClick}><div /></div>
    );
    var child = ReactDOM.findDOMNode(element).firstChild;

    onClick.mockClear();
    ReactTestUtils.SimulateNative.click(child);
    expect(onClick.mock.calls.length).toBe(1);
  });

  ['button', 'input', 'select', 'textarea'].forEach(function(tagName) {

    describe(tagName, function() {

      it('should forward clicks when it starts out not disabled', () => {
        var element = React.createElement(tagName, {
          onClick: onClick,
        });

        expectClickThru(mounted(element));
      });

      it('should not forward clicks when it starts out disabled', () => {
        var element = React.createElement(tagName, {
          onClick: onClick,
          disabled: true,
        });

        expectNoClickThru(mounted(element));
      });

      it('should forward clicks when it becomes not disabled', () => {
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

      it('should not forward clicks when it becomes disabled', () => {
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

      it('should work correctly if the listener is changed', () => {
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


  describe('iOS bubbling click fix', function() {
    // See http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html

    beforeEach(function() {
      onClick.mockClear();
    });

    it('does not add a local click to interactive elements', function() {
      var container = document.createElement('div');

      ReactDOM.render(<button onClick={ onClick } />, container);

      var node = container.firstChild;

      node.dispatchEvent(new MouseEvent('click'));

      expect(onClick.mock.calls.length).toBe(0);
    });

    it('adds a local click listener to non-interactive elements', function() {
      var container = document.createElement('div');

      ReactDOM.render(<div onClick={ onClick } />, container);

      var node = container.firstChild;

      node.dispatchEvent(new MouseEvent('click'));

      expect(onClick.mock.calls.length).toBe(0);
    });
  });
});
