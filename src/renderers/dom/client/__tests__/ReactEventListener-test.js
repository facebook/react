/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var mocks = require('mocks');


var EVENT_TARGET_PARAM = 1;

describe('ReactEventListener', function() {
  var React;

  var ReactMount;
  var ReactEventListener;
  var ReactTestUtils;
  var handleTopLevel;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');

    ReactMount = require('ReactMount');
    ReactEventListener = require('ReactEventListener');
    ReactTestUtils = require('ReactTestUtils');

    handleTopLevel = mocks.getMockFunction();
    ReactEventListener._handleTopLevel = handleTopLevel;
  });

  describe('Propagation', function() {
    it('should propagate events one level down', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactMount.render(childControl, childContainer);
      parentControl =
        ReactMount.render(parentControl, parentContainer);
      React.findDOMNode(parentControl).appendChild(childContainer);

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: React.findDOMNode(childControl),
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(React.findDOMNode(childControl));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(React.findDOMNode(parentControl));
    });

    it('should propagate events two levels down', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      var grandParentContainer = document.createElement('div');
      var grandParentControl = <div>Parent</div>;
      childControl = ReactMount.render(childControl, childContainer);
      parentControl =
        ReactMount.render(parentControl, parentContainer);
      grandParentControl =
        ReactMount.render(grandParentControl, grandParentContainer);
      React.findDOMNode(parentControl).appendChild(childContainer);
      React.findDOMNode(grandParentControl).appendChild(parentContainer);

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: React.findDOMNode(childControl),
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(3);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(React.findDOMNode(childControl));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(React.findDOMNode(parentControl));
      expect(calls[2][EVENT_TARGET_PARAM])
        .toBe(React.findDOMNode(grandParentControl));
    });

    it('should not get confused by disappearing elements', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactMount.render(childControl, childContainer);
      parentControl =
        ReactMount.render(parentControl, parentContainer);
      React.findDOMNode(parentControl).appendChild(childContainer);

      // ReactBrowserEventEmitter.handleTopLevel might remove the
      // target from the DOM. Here, we have handleTopLevel remove the
      // node when the first event handlers are called; we'll still
      // expect to receive a second call for the parent control.
      var childNode = React.findDOMNode(childControl);
      handleTopLevel.mockImplementation(
        function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
          if (topLevelTarget === childNode) {
            ReactMount.unmountComponentAtNode(childContainer);
          }
        }
      );

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: childNode,
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(childNode);
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(React.findDOMNode(parentControl));
    });

    it('should batch between handlers from different roots', function() {
      var childContainer = document.createElement('div');
      var parentContainer = document.createElement('div');
      var childControl = ReactMount.render(
        <div>Child</div>,
        childContainer
      );
      var parentControl = ReactMount.render(
        <div>Parent</div>,
        parentContainer
      );
      React.findDOMNode(parentControl).appendChild(childContainer);

      // Suppose an event handler in each root enqueues an update to the
      // childControl element -- the two updates should get batched together.
      var childNode = React.findDOMNode(childControl);
      handleTopLevel.mockImplementation(
        function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
          ReactMount.render(
            <div>{topLevelTarget === childNode ? '1' : '2'}</div>,
            childContainer
          );
          // Since we're batching, neither update should yet have gone through.
          expect(childNode.textContent).toBe('Child');
        }
      );

      var callback =
        ReactEventListener.dispatchEvent.bind(ReactEventListener, 'test');
      callback({
        target: childNode,
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(childNode.textContent).toBe('2');
    });
  });

  it('should not fire duplicate events for a React DOM tree', function() {
    var Wrapper = React.createClass({

      getInner: function() {
        return this.refs.inner;
      },

      render: function() {
        var inner = <div ref="inner">Inner</div>;
        return <div><div id="outer">{inner}</div></div>;
      },

    });

    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
    callback({
      target: React.findDOMNode(instance.getInner()),
    });

    var calls = handleTopLevel.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][EVENT_TARGET_PARAM])
      .toBe(React.findDOMNode(instance.getInner()));
  });
});
