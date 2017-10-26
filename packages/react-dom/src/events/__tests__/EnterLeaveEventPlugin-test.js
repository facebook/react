/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var EnterLeaveEventPlugin;
var React;
var ReactDOM;
var ReactDOMComponentTree;
var ReactTestUtils;

describe('EnterLeaveEventPlugin', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    // TODO: can we express this test with only public API?
    ReactDOMComponentTree = require('../../client/ReactDOMComponentTree');
    EnterLeaveEventPlugin = require('../EnterLeaveEventPlugin');
  });

  it('should set relatedTarget properly in iframe', () => {
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    var iframeDocument = iframe.contentDocument;

    iframeDocument.write(
      '<!DOCTYPE html><html><head></head><body><div></div></body></html>',
    );
    iframeDocument.close();

    var component = ReactDOM.render(
      <div />,
      iframeDocument.body.getElementsByTagName('div')[0],
    );
    var div = ReactDOM.findDOMNode(component);

    var extracted = EnterLeaveEventPlugin.extractEvents(
      'topMouseOver',
      ReactDOMComponentTree.getInstanceFromNode(div),
      {target: div},
      div,
    );
    expect(extracted.length).toBe(2);

    var leave = extracted[0];
    var enter = extracted[1];

    expect(leave.target).toBe(iframe.contentWindow);
    expect(leave.relatedTarget).toBe(div);
    expect(enter.target).toBe(div);
    expect(enter.relatedTarget).toBe(iframe.contentWindow);
  });

  // Regression test for https://github.com/facebook/react/issues/10906.
  it('should find the common parent after updates', () => {
    let parentEnterCalls = 0;
    let childEnterCalls = 0;
    let parent = null;
    class Parent extends React.Component {
      render() {
        return (
          <div
            onMouseEnter={() => parentEnterCalls++}
            ref={node => (parent = node)}>
            {this.props.showChild &&
              <div onMouseEnter={() => childEnterCalls++} />}
          </div>
        );
      }
    }

    const div = document.createElement('div');
    ReactDOM.render(<Parent />, div);
    // The issue only reproduced on insertion during the first update.
    ReactDOM.render(<Parent showChild={true} />, div);

    // Enter from parent into the child.
    ReactTestUtils.simulateNativeEventOnNode('topMouseOut', parent, {
      target: parent,
      relatedTarget: parent.firstChild,
    });

    // Entering a child should fire on the child, not on the parent.
    expect(childEnterCalls).toBe(1);
    expect(parentEnterCalls).toBe(0);
  });
});
