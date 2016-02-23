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


describe('ReactDOMButton', function() {
  let React;
  let ReactDOM;
  let ReactTestUtils;

  const onClick = jest.genMockFn();

  function expectClickThru(button) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(button));
    expect(onClick.mock.calls.length).toBe(1);
  }

  function expectNoClickThru(button) {
    onClick.mockClear();
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(button));
    expect(onClick.mock.calls.length).toBe(0);
  }

  function mounted(button) {
    button = ReactTestUtils.renderIntoDocument(button);
    return button;
  }

  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
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
    const container = document.createElement('div');
    let btn = ReactDOM.render(
      <button disabled={true} onClick={onClick} />,
      container
    );
    btn = ReactDOM.render(
      <button onClick={onClick} />,
      container
    );
    expectClickThru(btn);
  });

  it('should not forward clicks when it becomes disabled', function() {
    const container = document.createElement('div');
    let btn = ReactDOM.render(
      <button onClick={onClick} />,
      container
    );
    btn = ReactDOM.render(
      <button disabled={true} onClick={onClick} />,
      container
    );
    expectNoClickThru(btn);
  });

  it('should work correctly if the listener is changed', function() {
    const container = document.createElement('div');
    let btn = ReactDOM.render(
      <button disabled={true} onClick={function() {}} />,
      container
    );
    btn = ReactDOM.render(
      <button disabled={false} onClick={onClick} />,
      container
    );
    expectClickThru(btn);
  });
});
