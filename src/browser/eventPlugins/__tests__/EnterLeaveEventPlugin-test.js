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

/*jslint evil: true */

'use strict';

var EnterLeaveEventPlugin;
var EventConstants;
var React;
var ReactMount;

var topLevelTypes;

describe('EnterLeaveEventPlugin', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
    EventConstants = require('EventConstants');
    React = require('React');
    ReactMount = require('ReactMount');

    topLevelTypes = EventConstants.topLevelTypes;
  });

  it('should set relatedTarget properly in iframe', function() {
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    var iframeDocument = iframe.contentDocument;

    iframeDocument.write(
      '<!DOCTYPE html><html><head></head><body></body></html>'
    );
    iframeDocument.close();

    var component = React.render(<div />, iframeDocument.body);
    var div = component.getDOMNode();

    var extracted = EnterLeaveEventPlugin.extractEvents(
      topLevelTypes.topMouseOver,
      div,
      ReactMount.getID(div),
      {target: div}
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
