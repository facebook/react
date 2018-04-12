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
  let React;
  let ReactDOM;
  let ReactTestUtils;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should trigger load events', () => {
    const onLoadSpy = jasmine.createSpy();
    let iframe = React.createElement('iframe', {onLoad: onLoadSpy});
    iframe = ReactTestUtils.renderIntoDocument(iframe);

    const loadEvent = document.createEvent('Event');
    loadEvent.initEvent('load', false, false);

    ReactDOM.findDOMNode(iframe).dispatchEvent(loadEvent);

    expect(onLoadSpy).toHaveBeenCalled();
  });
});
