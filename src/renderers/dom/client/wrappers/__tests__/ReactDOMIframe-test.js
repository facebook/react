/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMIframe', () => {
  var React;
  var ReactDOM;
  var ReactTestUtils;

  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
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
