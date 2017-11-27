/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactDOMComponentTree;
var ReactTestUtils;
var SelectEventPlugin;

describe('SelectEventPlugin', () => {
  function extract(node, topLevelEvent) {
    return SelectEventPlugin.extractEvents(
      topLevelEvent,
      ReactDOMComponentTree.getInstanceFromNode(node),
      {target: node},
      node,
    );
  }

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    // TODO: can we express this test with only public API?
    ReactDOMComponentTree = require('../../client/ReactDOMComponentTree');
    SelectEventPlugin = require('../SelectEventPlugin').default;
  });

  it('should skip extraction if no listeners are present', () => {
    class WithoutSelect extends React.Component {
      render() {
        return <input type="text" />;
      }
    }

    var rendered = ReactTestUtils.renderIntoDocument(<WithoutSelect />);
    var node = ReactDOM.findDOMNode(rendered);
    node.focus();

    // It seems that .focus() isn't triggering this event in our test
    // environment so we need to ensure it gets set for this test to be valid.
    var fakeNativeEvent = function() {};
    fakeNativeEvent.target = node;
    ReactTestUtils.simulateNativeEventOnNode('topFocus', node, fakeNativeEvent);

    var mousedown = extract(node, 'topMouseDown');
    expect(mousedown).toBe(null);

    var mouseup = extract(node, 'topMouseUp');
    expect(mouseup).toBe(null);
  });

  it('should register event only if the `onSelect` listener is present', () => {
    var select = jest.fn();
    var onSelect = event => {
      expect(typeof event).toBe('object');
      expect(event.type).toBe('select');
      expect(event.target).toBe(node);
      select(event.currentTarget);
    };

    var childContainer = document.createElement('div');
    var childNode = ReactDOM.render(
      <input type="text" onSelect={onSelect} />,
      childContainer,
    );
    document.body.appendChild(childContainer);

    var node = ReactDOM.findDOMNode(childNode);
    node.focus();
    expect(select.mock.calls.length).toBe(0);

    var nativeEvent = document.createEvent('Event');
    nativeEvent.initEvent('mousedown', true, true);
    childNode.dispatchEvent(nativeEvent);
    expect(select.mock.calls.length).toBe(0);

    nativeEvent = document.createEvent('Event');
    nativeEvent.initEvent('mouseup', true, true);
    childNode.dispatchEvent(nativeEvent);
    expect(select.mock.calls.length).toBe(1);

    document.body.removeChild(childContainer);
  });
});
