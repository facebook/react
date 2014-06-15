/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @emails react-core
 * @jsx React.DOM
 */

'use strict';

var mocks = require('mocks');


var EVENT_TARGET_PARAM = 1;

describe('ReactEventListener', function() {
  var React;

  var ReactMount;
  var ReactEventListener;
  var handleTopLevel;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');

    ReactMount = require('ReactMount');
    ReactEventListener = require('ReactEventListener');

    handleTopLevel = mocks.getMockFunction();
    ReactEventListener._handleTopLevel = handleTopLevel;
  });

  describe('Propagation', function() {
    it('should propagate events one level down', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactMount.renderComponent(childControl, childContainer);
      parentControl =
        ReactMount.renderComponent(parentControl, parentContainer);
      parentControl.getDOMNode().appendChild(childContainer);

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: childControl.getDOMNode()
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(childControl.getDOMNode());
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(parentControl.getDOMNode());
    });

    it('should propagate events two levels down', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      var grandParentContainer = document.createElement('div');
      var grandParentControl = <div>Parent</div>;
      childControl = ReactMount.renderComponent(childControl, childContainer);
      parentControl =
        ReactMount.renderComponent(parentControl, parentContainer);
      grandParentControl =
        ReactMount.renderComponent(grandParentControl, grandParentContainer);
      parentControl.getDOMNode().appendChild(childContainer);
      grandParentControl.getDOMNode().appendChild(parentContainer);

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: childControl.getDOMNode()
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(3);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(childControl.getDOMNode());
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(parentControl.getDOMNode());
      expect(calls[2][EVENT_TARGET_PARAM])
        .toBe(grandParentControl.getDOMNode());
    });

    it('should not get confused by disappearing elements', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactMount.renderComponent(childControl, childContainer);
      parentControl =
        ReactMount.renderComponent(parentControl, parentContainer);
      parentControl.getDOMNode().appendChild(childContainer);

      // ReactBrowserEventEmitter.handleTopLevel might remove the
      // target from the DOM. Here, we have handleTopLevel remove the
      // node when the first event handlers are called; we'll still
      // expect to receive a second call for the parent control.
      var childNode = childControl.getDOMNode();
      handleTopLevel.mockImplementation(
        function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
          if (topLevelTarget === childNode) {
            ReactMount.unmountComponentAtNode(childContainer);
          }
        }
      );

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: childNode
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(childNode);
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(parentControl.getDOMNode());
    });

    it('should batch between handlers from different roots', function() {
      var childContainer = document.createElement('div');
      var parentContainer = document.createElement('div');
      var childControl = ReactMount.renderComponent(
        <div>Child</div>,
        childContainer
      );
      var parentControl = ReactMount.renderComponent(
        <div>Parent</div>,
        parentContainer
      );
      parentControl.getDOMNode().appendChild(childContainer);

      // Suppose an event handler in each root enqueues an update to the
      // childControl element -- the two updates should get batched together.
      var childNode = childControl.getDOMNode();
      handleTopLevel.mockImplementation(
        function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
          ReactMount.renderComponent(
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
        target: childNode
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(childNode.textContent).toBe('2');
    });
  });

  it('should not fire duplicate events for a React DOM tree', function() {
    var container = document.createElement('div');
    var Wrapper = React.createClass({

      getInner: function() {
        return this.refs.inner;
      },

      render: function() {
        var inner = <div ref="inner">Inner</div>;
        return <div><div id="outer">{inner}</div></div>;
      }

    });

    var instance = ReactMount.renderComponent(<Wrapper />, container);

    var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
    callback({
      target: instance.getInner().getDOMNode()
    });

    var calls = handleTopLevel.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][EVENT_TARGET_PARAM]).toBe(instance.getInner().getDOMNode());
  });
});
