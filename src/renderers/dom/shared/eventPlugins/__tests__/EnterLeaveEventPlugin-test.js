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

var EnterLeaveEventPlugin;
var React;
var ReactDOM;
var ReactDOMComponentTree;
var ReactTestUtils;
describe.only('EnterLeaveEventPlugin', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    // TODO: can we express this test with only public API?
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
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

  it('should emit mouseout and mouseenter events when cursor moves from disabled button', () => {
    var disabledButton;
    var notDisabledButton;
    ReactTestUtils.renderIntoDocument(
      <div>
        <button ref={node => (notDisabledButton = node)} />
        <button ref={node => (disabledButton = node)} disabled={true} />
      </div>,
    );
    var extracted = EnterLeaveEventPlugin.extractEvents(
      'topMouseOver',
      ReactDOMComponentTree.getInstanceFromNode(notDisabledButton),
      {
        target: notDisabledButton,
        relatedTarget: disabledButton,
      },
      notDisabledButton,
    );

    expect(extracted.length).toBe(2);

    var leave = extracted[0];
    var enter = extracted[1];

    expect(leave.type).toBe('mouseleave');
    expect(enter.type).toBe('mouseenter');
  });
});
