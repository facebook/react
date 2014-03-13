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

"use strict";

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
