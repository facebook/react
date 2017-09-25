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

describe('EnterLeaveEventPlugin', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

    EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
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
});
