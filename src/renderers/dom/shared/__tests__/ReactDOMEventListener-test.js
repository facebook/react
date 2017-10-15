/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var EVENT_TARGET_PARAM = 1;

describe('ReactDOMEventListener', () => {
  var React;
  var ReactDOM;
  var ReactDOMComponentTree;
  var ReactDOMEventListener;
  var ReactTestUtils;
  var handleTopLevel;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    // TODO: can we express this test with only public API?
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactDOMEventListener = require('ReactDOMEventListener');
    ReactTestUtils = require('react-dom/test-utils');

    handleTopLevel = jest.fn();
    ReactDOMEventListener._handleTopLevel = handleTopLevel;
  });

  it('should dispatch events from outside React tree', () => {
    var otherNode = document.createElement('h1');
    var component = ReactDOM.render(<div />, document.createElement('div'));
    expect(handleTopLevel.mock.calls.length).toBe(0);
    ReactDOMEventListener.dispatchEvent('topMouseOut', {
      type: 'mouseout',
      fromElement: otherNode,
      target: otherNode,
      srcElement: otherNode,
      toElement: ReactDOM.findDOMNode(component),
      relatedTarget: ReactDOM.findDOMNode(component),
      view: window,
      path: [otherNode, otherNode],
    });
    expect(handleTopLevel.mock.calls.length).toBe(1);
  });

  describe('Propagation', () => {
    it('should propagate events one level down', () => {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl = ReactDOM.render(parentControl, parentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      var callback = ReactDOMEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: ReactDOM.findDOMNode(childControl),
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(
        ReactDOMComponentTree.getInstanceFromNode(childControl),
      );
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(
        ReactDOMComponentTree.getInstanceFromNode(parentControl),
      );
    });

    it('should propagate events two levels down', () => {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      var grandParentContainer = document.createElement('div');
      var grandParentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl = ReactDOM.render(parentControl, parentContainer);
      grandParentControl = ReactDOM.render(
        grandParentControl,
        grandParentContainer,
      );
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);
      ReactDOM.findDOMNode(grandParentControl).appendChild(parentContainer);

      var callback = ReactDOMEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: ReactDOM.findDOMNode(childControl),
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(3);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(
        ReactDOMComponentTree.getInstanceFromNode(childControl),
      );
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(
        ReactDOMComponentTree.getInstanceFromNode(parentControl),
      );
      expect(calls[2][EVENT_TARGET_PARAM]).toBe(
        ReactDOMComponentTree.getInstanceFromNode(grandParentControl),
      );
    });

    it('should not get confused by disappearing elements', () => {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl = ReactDOM.render(parentControl, parentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      // ReactBrowserEventEmitter.handleTopLevel might remove the
      // target from the DOM. Here, we have handleTopLevel remove the
      // node when the first event handlers are called; we'll still
      // expect to receive a second call for the parent control.
      var childNode = ReactDOM.findDOMNode(childControl);
      handleTopLevel.mockImplementation(function(
        topLevelType,
        topLevelTarget,
        topLevelTargetID,
        nativeEvent,
      ) {
        if (topLevelTarget === childNode) {
          ReactDOM.unmountComponentAtNode(childContainer);
        }
      });

      var callback = ReactDOMEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: childNode,
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(
        ReactDOMComponentTree.getInstanceFromNode(childNode),
      );
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(
        ReactDOMComponentTree.getInstanceFromNode(parentControl),
      );
    });

    it('should batch between handlers from different roots', () => {
      var childContainer = document.createElement('div');
      var parentContainer = document.createElement('div');
      var childControl = ReactDOM.render(<div>Child</div>, childContainer);
      var parentControl = ReactDOM.render(<div>Parent</div>, parentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      // Suppose an event handler in each root enqueues an update to the
      // childControl element -- the two updates should get batched together.
      var childNode = ReactDOM.findDOMNode(childControl);
      handleTopLevel.mockImplementation(function(
        topLevelType,
        topLevelTarget,
        topLevelTargetID,
        nativeEvent,
      ) {
        ReactDOM.render(
          <div>{topLevelTarget === childNode ? '1' : '2'}</div>,
          childContainer,
        );
        // Since we're batching, neither update should yet have gone through.
        expect(childNode.textContent).toBe('Child');
      });

      var callback = ReactDOMEventListener.dispatchEvent.bind(
        ReactDOMEventListener,
        'test',
      );
      callback({
        target: childNode,
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(childNode.textContent).toBe('2');
    });
  });

  it('should not fire duplicate events for a React DOM tree', () => {
    class Wrapper extends React.Component {
      getInner = () => {
        return this.refs.inner;
      };

      render() {
        var inner = <div ref="inner">Inner</div>;
        return <div><div id="outer">{inner}</div></div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    var callback = ReactDOMEventListener.dispatchEvent.bind(null, 'test');
    callback({
      target: ReactDOM.findDOMNode(instance.getInner()),
    });

    var calls = handleTopLevel.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][EVENT_TARGET_PARAM]).toBe(
      ReactDOMComponentTree.getInstanceFromNode(instance.getInner()),
    );
  });
});
