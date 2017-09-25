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
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactTestUtils = require('ReactTestUtils');
    SelectEventPlugin = require('SelectEventPlugin');
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

    var mousedown = extract(node, 'topMouseDown');
    expect(mousedown).toBe(null);

    var mouseup = extract(node, 'topMouseUp');
    expect(mouseup).toBe(null);
  });

  it('should extract if an `onSelect` listener is present', () => {
    class WithSelect extends React.Component {
      render() {
        return <input type="text" onSelect={this.props.onSelect} />;
      }
    }

    var cb = jest.fn();

    var rendered = ReactTestUtils.renderIntoDocument(
      <WithSelect onSelect={cb} />,
    );
    var node = ReactDOM.findDOMNode(rendered);

    node.selectionStart = 0;
    node.selectionEnd = 0;
    node.focus();

    var focus = extract(node, 'topFocus');
    expect(focus).toBe(null);

    var mousedown = extract(node, 'topMouseDown');
    expect(mousedown).toBe(null);

    var mouseup = extract(node, 'topMouseUp');
    expect(mouseup).not.toBe(null);
    expect(typeof mouseup).toBe('object');
    expect(mouseup.type).toBe('select');
    expect(mouseup.target).toBe(node);
  });
});
