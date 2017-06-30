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

describe('ReactDOMIframe', () => {
  var React;
  var ReactDOM;
  var ReactTestUtils;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should trigger load events', () => {
    var onLoadSpy = jasmine.createSpy();
    var iframe = React.createElement('iframe', {onLoad: onLoadSpy});
    iframe = ReactTestUtils.renderIntoDocument(iframe);

    var loadEvent = document.createEvent('Event');
    loadEvent.initEvent('load', false, false);

    ReactDOM.findDOMNode(iframe).dispatchEvent(loadEvent);

    expect(onLoadSpy).toHaveBeenCalled();
  });
});
