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

describe('ReactDOMIframe', function() {
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should trigger load events', function() {
    var onLoadSpy = jasmine.createSpy();
    var iframe = React.createElement('iframe', {onLoad: onLoadSpy});
    iframe = ReactTestUtils.renderIntoDocument(iframe);

    var loadEvent = document.createEvent('Event');
    loadEvent.initEvent('load', false, false);

    React.findDOMNode(iframe).dispatchEvent(loadEvent);

    expect(onLoadSpy).toHaveBeenCalled();
  });
});
