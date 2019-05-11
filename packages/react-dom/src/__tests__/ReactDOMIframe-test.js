/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMIframe', () => {
  let React;
  let ReactTestUtils;

  beforeEach(() => {
    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should trigger load events', () => {
    const onLoadSpy = jest.fn();
    let iframe = React.createElement('iframe', {onLoad: onLoadSpy});
    iframe = ReactTestUtils.renderIntoDocument(iframe);

    const loadEvent = document.createEvent('Event');
    loadEvent.initEvent('load', false, false);

    iframe.dispatchEvent(loadEvent);

    expect(onLoadSpy).toHaveBeenCalled();
  });
});
