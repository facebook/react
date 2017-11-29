/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactDOMComponentTree;
let ReactTestUtils;
let SelectEventPlugin;

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

    const rendered = ReactTestUtils.renderIntoDocument(<WithoutSelect />);
    const node = ReactDOM.findDOMNode(rendered);
    node.focus();

    // It seems that .focus() isn't triggering this event in our test
    // environment so we need to ensure it gets set for this test to be valid.
    const fakeNativeEvent = function() {};
    fakeNativeEvent.target = node;
    ReactTestUtils.simulateNativeEventOnNode('topFocus', node, fakeNativeEvent);

    const mousedown = extract(node, 'topMouseDown');
    expect(mousedown).toBe(null);

    const mouseup = extract(node, 'topMouseUp');
    expect(mouseup).toBe(null);
  });

  it('should extract if an `onSelect` listener is present', () => {
    class WithSelect extends React.Component {
      render() {
        return <input type="text" onSelect={this.props.onSelect} />;
      }
    }

    const cb = jest.fn();

    const rendered = ReactTestUtils.renderIntoDocument(
      <WithSelect onSelect={cb} />,
    );
    const node = ReactDOM.findDOMNode(rendered);

    node.selectionStart = 0;
    node.selectionEnd = 0;
    node.focus();

    var focus = extract(node, 'topFocus');
    expect(focus).toBe(null);

    const mousedown = extract(node, 'topMouseDown');
    expect(mousedown).toBe(null);

    const mouseup = extract(node, 'topMouseUp');
    expect(mouseup).not.toBe(null);
    expect(typeof mouseup).toBe('object');
    expect(mouseup.type).toBe('select');
    expect(mouseup.target).toBe(node);
  });
});
