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

var mockModules = require('mock-modules');
mockModules.mock('getActiveElement');

var EventConstants;
var React;
var ReactMount;
var ReactTestUtils;
var SelectEventPlugin;

var getActiveElement;

var topLevelTypes;

describe('SelectEventPlugin', function() {
  function extract(node, topLevelEvent) {
    return SelectEventPlugin.extractEvents(
      topLevelEvent,
      node,
      ReactMount.getID(node),
      {target: node},
      node
    );
  }

  beforeEach(function() {
    mockModules.dumpCache();

    EventConstants = require('EventConstants');
    React = require('React');
    ReactMount = require('ReactMount');
    ReactTestUtils = require('ReactTestUtils');
    SelectEventPlugin = require('SelectEventPlugin');

    getActiveElement = require('getActiveElement');

    topLevelTypes = EventConstants.topLevelTypes;
  });

  it('should skip extraction if no listeners are present', function() {
    var WithoutSelect = React.createClass({
      render: function() {
        return <input type="text" />;
      },
    });

    var rendered = ReactTestUtils.renderIntoDocument(<WithoutSelect />);
    var node = React.findDOMNode(rendered);
    getActiveElement.mockReturnValue(node);

    var mousedown = extract(node, topLevelTypes.topMouseDown);
    expect(mousedown).toBe(null);

    var mouseup = extract(node, topLevelTypes.topMouseUp);
    expect(mouseup).toBe(null);
  });

  it('should extract if an `onSelect` listener is present', function() {
    var mocks = require('mocks');

    var WithSelect = React.createClass({
      render: function() {
        return <input type="text" onSelect={this.props.onSelect} />;
      },
    });

    var cb = mocks.getMockFunction();

    var rendered = ReactTestUtils.renderIntoDocument(
      <WithSelect onSelect={cb} />
    );
    var node = React.findDOMNode(rendered);

    node.selectionStart = 0;
    node.selectionEnd = 0;
    getActiveElement.mockReturnValue(node);

    var focus = extract(node, topLevelTypes.topFocus);
    expect(focus).toBe(null);

    var mousedown = extract(node, topLevelTypes.topMouseDown);
    expect(mousedown).toBe(null);

    var mouseup = extract(node, topLevelTypes.topMouseUp);
    expect(mouseup).not.toBe(null);
    expect(typeof mouseup).toBe('object');
    expect(mouseup.type).toBe('select');
    expect(mouseup.target).toBe(node);
  });
});
