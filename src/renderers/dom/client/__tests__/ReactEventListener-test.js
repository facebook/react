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


const EVENT_TARGET_PARAM = 1;

describe('ReactEventListener', function() {
  let React;
  let ReactDOM;
  let ReactDOMComponentTree;
  let ReactEventListener;
  let ReactTestUtils;
  let handleTopLevel;

  beforeEach(function() {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactEventListener = require('ReactEventListener');
    ReactTestUtils = require('ReactTestUtils');

    handleTopLevel = jest.genMockFn();
    ReactEventListener._handleTopLevel = handleTopLevel;
  });

  it('should dispatch events from outside React tree', function() {
    const otherNode = document.createElement('h1');
    const component = ReactDOM.render(<div />, document.createElement('div'));
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
      const childContainer = document.createElement('div');
      let childControl = <div>Child</div>;
      const parentContainer = document.createElement('div');
      let parentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl =
        ReactDOM.render(parentControl, parentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      const callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: ReactDOM.findDOMNode(childControl),
      });

      const calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(childControl));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(parentControl));
    });

    it('should propagate events two levels down', function() {
      const childContainer = document.createElement('div');
      let childControl = <div>Child</div>;
      const parentContainer = document.createElement('div');
      let parentControl = <div>Parent</div>;
      const grandParentContainer = document.createElement('div');
      let grandParentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl =
        ReactDOM.render(parentControl, parentContainer);
      grandParentControl =
        ReactDOM.render(grandParentControl, grandParentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);
      ReactDOM.findDOMNode(grandParentControl).appendChild(parentContainer);

      const callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: ReactDOM.findDOMNode(childControl),
      });

      const calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(3);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(childControl));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(parentControl));
      expect(calls[2][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(grandParentControl));
    });

    it('should not get confused by disappearing elements', function() {
      const childContainer = document.createElement('div');
      let childControl = <div>Child</div>;
      const parentContainer = document.createElement('div');
      let parentControl = <div>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl =
        ReactDOM.render(parentControl, parentContainer);
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      // ReactBrowserEventEmitter.handleTopLevel might remove the
      // target from the DOM. Here, we have handleTopLevel remove the
      // node when the first event handlers are called; we'll still
      // expect to receive a second call for the parent control.
      const childNode = ReactDOM.findDOMNode(childControl);
      handleTopLevel.mockImplementation(
        function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
          if (topLevelTarget === childNode) {
            ReactDOM.unmountComponentAtNode(childContainer);
          }
        }
      );

      const callback = ReactEventListener.dispatchEvent.bind(null, 'test');
      callback({
        target: childNode,
      });

      const calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(childNode));
      expect(calls[1][EVENT_TARGET_PARAM])
        .toBe(ReactDOMComponentTree.getInstanceFromNode(parentControl));
    });

    it('should batch between handlers from different roots', function() {
      const childContainer = document.createElement('div');
      const parentContainer = document.createElement('div');
      const childControl = ReactDOM.render(
        <div>Child</div>,
        childContainer
      );
      const parentControl = ReactDOM.render(
        <div>Parent</div>,
        parentContainer
      );
      ReactDOM.findDOMNode(parentControl).appendChild(childContainer);

      // Suppose an event handler in each root enqueues an update to the
      // childControl element -- the two updates should get batched together.
      const childNode = ReactDOM.findDOMNode(childControl);
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

      const callback =
        ReactEventListener.dispatchEvent.bind(ReactEventListener, 'test');
      callback({
        target: childNode,
      });

      const calls = handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(childNode.textContent).toBe('2');
    });
  });

  it('should not fire duplicate events for a React DOM tree', function() {
    const Wrapper = React.createClass({

      getInner: function() {
        return this.refs.inner;
      },

      render: function() {
        const inner = <div ref="inner">Inner</div>;
        return <div><div id="outer">{inner}</div></div>;
      },

    });

    const instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    const callback = ReactEventListener.dispatchEvent.bind(null, 'test');
    callback({
      target: ReactDOM.findDOMNode(instance.getInner()),
    });

    const calls = handleTopLevel.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][EVENT_TARGET_PARAM])
      .toBe(ReactDOMComponentTree.getInstanceFromNode(instance.getInner()));
  });
});
