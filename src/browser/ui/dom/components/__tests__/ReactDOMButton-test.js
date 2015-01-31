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
  var ReactTestUtils;

  var onClick = mocks.getMockFunction();

  function expectClickThru(button) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(button.getDOMNode());
    expect(onClick.mock.calls.length).toBe(1);
  }

  function expectNoClickThru(button) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(button.getDOMNode());
    expect(onClick.mock.calls.length).toBe(0);
  }

  function mounted(button) {
    button = ReactTestUtils.renderIntoDocument(button);
    return button;
  }

  beforeEach(function() {
    React = require('React');
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
    var btn = mounted(<button disabled={true} onClick={onClick} />);
    btn.setProps({disabled: false});
    expectClickThru(btn);
  });

  it('should not forward clicks when it becomes disabled', function() {
    var btn = mounted(<button onClick={onClick} />);
    btn.setProps({disabled: true});
    expectNoClickThru(btn);
  });

  it('should work correctly if the listener is changed', function() {
    var btn = mounted(
      <button disabled={true} onClick={function() {}} />
    );

    btn.setProps({
      disabled: false,
      onClick: onClick
    });

    expectClickThru(btn);
  });
});
