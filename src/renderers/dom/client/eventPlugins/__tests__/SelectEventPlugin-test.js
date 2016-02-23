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

let EventConstants;
let React;
let ReactDOM;
let ReactDOMComponentTree;
let ReactTestUtils;
let SelectEventPlugin;

let topLevelTypes;

describe('SelectEventPlugin', function() {
  function extract(node, topLevelEvent) {
    return SelectEventPlugin.extractEvents(
      topLevelEvent,
      ReactDOMComponentTree.getInstanceFromNode(node),
      {target: node},
      node
    );
  }

  beforeEach(function() {
    EventConstants = require('EventConstants');
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactTestUtils = require('ReactTestUtils');
    SelectEventPlugin = require('SelectEventPlugin');

    topLevelTypes = EventConstants.topLevelTypes;
  });

  it('should skip extraction if no listeners are present', function() {
    const WithoutSelect = React.createClass({
      render: function() {
        return <input type="text" />;
      },
    });

    const rendered = ReactTestUtils.renderIntoDocument(<WithoutSelect />);
    const node = ReactDOM.findDOMNode(rendered);
    node.focus();

    const mousedown = extract(node, topLevelTypes.topMouseDown);
    expect(mousedown).toBe(null);

    const mouseup = extract(node, topLevelTypes.topMouseUp);
    expect(mouseup).toBe(null);
  });

  it('should extract if an `onSelect` listener is present', function() {
    const WithSelect = React.createClass({
      render: function() {
        return <input type="text" onSelect={this.props.onSelect} />;
      },
    });

    const cb = jest.genMockFn();

    const rendered = ReactTestUtils.renderIntoDocument(
      <WithSelect onSelect={cb} />
    );
    const node = ReactDOM.findDOMNode(rendered);

    node.selectionStart = 0;
    node.selectionEnd = 0;
    node.focus();

    var focus = extract(node, topLevelTypes.topFocus);
    expect(focus).toBe(null);

    const mousedown = extract(node, topLevelTypes.topMouseDown);
    expect(mousedown).toBe(null);

    const mouseup = extract(node, topLevelTypes.topMouseUp);
    expect(mouseup).not.toBe(null);
    expect(typeof mouseup).toBe('object');
    expect(mouseup.type).toBe('select');
    expect(mouseup.target).toBe(node);
  });
});
