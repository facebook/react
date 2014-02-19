/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

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

    if (!iframeDocument.innerHTML) {
      iframeDocument.innerHTML = '<html><head></head><body></body></html>';
    }

    var component = React.renderComponent(<div />, iframeDocument.body);
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
