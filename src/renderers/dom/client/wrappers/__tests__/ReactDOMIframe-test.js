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

describe('ReactDOMIframe', function() {
  let React;
  let ReactDOM;
  let ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should trigger load events', function() {
    const onLoadSpy = jasmine.createSpy();
    let iframe = React.createElement('iframe', {onLoad: onLoadSpy});
    iframe = ReactTestUtils.renderIntoDocument(iframe);

    const loadEvent = document.createEvent('Event');
    loadEvent.initEvent('load', false, false);

    ReactDOM.findDOMNode(iframe).dispatchEvent(loadEvent);

    expect(onLoadSpy).toHaveBeenCalled();
  });
});
