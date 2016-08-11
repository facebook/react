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


var EVENT_TARGET_PARAM = 1;

describe('ReactEventListener', function() {
  var React;
  var ReactDOM;
  var ReactDOMComponentTree;
  var ReactEventListener;
  var ReactTestUtils;
  var handleTopLevel;

  beforeEach(function() {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactEventListener = require('ReactEventListener');
    ReactTestUtils = require('ReactTestUtils');

    handleTopLevel = jest.fn();
    ReactEventListener._handleTopLevel = handleTopLevel;
  });

  it('should dispatch events from outside React tree', function() {
    var otherNode = document.createElement('h1');
    var component = ReactDOM.render(<div />, document.createElement('div'));
    expect(handleTopLevel.mock.calls.length).toBe(0);
    ReactEventListener.dispatchEvent(
      'topMouseOut',
      {
        type: 'mouseout',
        fromElement: otherNode,
        target: otherNode,
        srcElement: otherNode,
        toElement: ReactDOM.findDOMNode(component),
        relatedTarget: ReactDOM.findDOMNode(component),
        view: window,
        path: [otherNode, otherNode],
      },
    );
    expect(handleTopLevel.mock.calls.length).toBe(1);
  });

  describe('Propagation', function() {
    it('should propagate events one level down', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl =
        ReactDOM.render(parentControl, parentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: ReactDOM.findDOMNode(childControl),
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(childControl));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(parentControl));
    });

    it('should propagate events two levels down', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      var grandParentContainer = document.createElement('div');
      var grandParentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl =
        ReactDOM.render(parentControl, parentContainer);
      grandParentControl =
        ReactDOM.render(grandParentControl, grandParentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);
      ReactDOM.findDOMNode(grandParentControl).appendChild(parentContainer);

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: ReactDOM.findDOMNode(childControl),
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(3);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(childControl));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(parentControl));
      expect(calls[2][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(grandParentControl));
    });

    it('should not get confused by disappearing elements', function() {
      var childContainer = document.createElement('div');
      var childControl = <div>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl =
        ReactDOM.render(parentControl, parentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      // ReactBrowserEventEmitter.handleTopLevel might remove the
      // target from the DOM. Here, we have handleTopLevel remove the
      // node when the first event handlers are called; we'll still
      // expect to receive a second call for the parent control.
      var childNode = ReactDOM.findDOMNode(childControl);
      handleTopLevel.mockImplementation(
        function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
          if (topLevelTarget === childNode) {
            ReactDOM.unmountComponentAtNode(childContainer);
          }
        }
      );

      var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: childNode,
      });

      var calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(childNode));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(parentControl));
    });

    it('should batch between handlers from different roots', function() {
      var childContainer = document.createElement('div');
      var parentContainer = document.createElement('div');
      var childControl = ReactDOM.render(
        <div>Child</div>,
        childContainer
      );
      var parentControl = ReactDOM.render(
        <div>Parent</div>,
        parentContainer
      );
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      // Suppose an event handler in each root enqueues an update to the
      // childControl element -- the two updates should get batched together.
      var childNode = ReactDOM.findDOMNode(childControl);
      handleTopLevel.mockImplementation(
        function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
          ReactDOM.render(
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

    var callback = ReactEventListener.dispatchEvent.bind(null, 'test');
    callback({
      target: ReactDOM.findDOMNode(instance.getInner()),
    });

    var calls = handleTopLevel.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][EVENT_TARGET_PARAM])
      .toBe(ReactDOMComponentTree.getInstanceFromNode(instance.getInner()));
  });

  it('documentResetCallback called when resetDocument called with provided document', function() {
    var iframe =document.createElement('iframe');
    var doc = iframe.contentDocument;
    var resetCalled = false;
    ReactEventListener.setDocumentResetCallback(function(d) {
      expect(d).toBe(doc);
      resetCalled = true;
    });
    ReactEventListener.resetDocument(doc);
    expect(resetCalled).toBe(true);
  });

  it('document event remover called once and removed upon first resetDocument', function() {
    var removed = false;
    ReactEventListener.addDocumentEventListenerRemover(function() {
      expect(removed).toBe(false);
      removed = true;
    });
    ReactEventListener.resetDocument(document);
    expect(removed).toBe(true);
    ReactEventListener.resetDocument(document);
    ReactEventListener.resetDocument(document);
  });

  it('multiple document event removers each called once and removed upon first resetDocument call', function() {
    var i = false;
    ReactEventListener.addDocumentEventListenerRemover(function() {
      expect(i).toBe(false);
      i = true;
    });
    var j = false;
    ReactEventListener.addDocumentEventListenerRemover(function() {
      expect(j).toBe(false);
      j = true;
    });
    var k = false;
    ReactEventListener.addDocumentEventListenerRemover(function() {
      expect(k).toBe(false);
      k = true;
    });
    ReactEventListener.resetDocument(document);
    expect(i).toBe(true);
    expect(j).toBe(true);
    expect(k).toBe(true);
    ReactEventListener.resetDocument(document);
    ReactEventListener.resetDocument(document);
  });
});
