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

/*jshint evil:true */

var mocks = require('mocks');

describe('ReactDOMButton', function() {
  var React;
  var ReactRenderer;
  var ReactTestUtils;

  var onClick = mocks.getMockFunction();

  function expectClickThru(buttonRenderer) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(React.findDOMNode(buttonRenderer.component));
    expect(onClick.mock.calls.length).toBe(1);
  }

  function expectNoClickThru(buttonRenderer) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(React.findDOMNode(buttonRenderer.component));
    expect(onClick.mock.calls.length).toBe(0);
  }

  function mounted(button) {
    var container = document.createElement('div');
    var buttonRenderer = new ReactRenderer(button, container);
    return buttonRenderer;
  }

  beforeEach(function() {
    React = require('React');
    ReactRenderer = require('ReactRenderer');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should forward clicks when it starts out not disabled', function() {
    expectClickThru(mounted(<button onClick={onClick} />));
  });

  it('should not forward clicks when it starts out disabled', function() {
    expectNoClickThru(
      mounted(<button disabled={true} onClick={onClick} />)
    );
  });

  it('should forward clicks when it becomes not disabled', function() {
    var btnRenderer = mounted(<button disabled={true} onClick={onClick} />);
    btnRenderer.setProps({disabled: false});
    expectClickThru(btnRenderer);
  });

  it('should not forward clicks when it becomes disabled', function() {
    var btnRenderer = mounted(<button onClick={onClick} />);
    btnRenderer.setProps({disabled: true});
    expectNoClickThru(btnRenderer);
  });

  it('should work correctly if the listener is changed', function() {
    var btnRenderer = mounted(
      <button disabled={true} onClick={function() {}} />
    );

    btnRenderer.setProps({
      disabled: false,
      onClick: onClick
    });

    expectClickThru(btnRenderer);
  });
});
