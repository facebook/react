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

describe('ReactDOMOption', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  var React;
  var ReactDOM;
  var ReactDOMFeatureFlags;
  var ReactTestUtils;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should flatten children to a string', () => {
    var stub = <option>{1} {'foo'}</option>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.innerHTML).toBe('1 foo');
  });

  it('should ignore and warn invalid children types', () => {
    spyOn(console, 'error');
    var el = <option>{1} <div /> {2}</option>;
    var node = ReactTestUtils.renderIntoDocument(el);
    expect(node.innerHTML).toBe('1  2');
    ReactTestUtils.renderIntoDocument(el);
    // only warn once
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(
      normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
    ).toContain(
      ReactDOMFeatureFlags.useFiber
        ? '<div> cannot appear as a child of <option>.\n' +
            '    in div (at **)\n' +
            '    in option (at **)'
        : 'Only strings and numbers are supported as <option> children.',
    );
  });

  it('should ignore null/undefined/false children without warning', () => {
    var stub = <option>{1} {false}{true}{null}{undefined} {2}</option>;
    spyOn(console, 'error');
    stub = ReactTestUtils.renderIntoDocument(stub);

    var node = ReactDOM.findDOMNode(stub);

    expectDev(console.error.calls.count()).toBe(0);
    expect(node.innerHTML).toBe('1  2');
  });

  it('should be able to use dangerouslySetInnerHTML on option', () => {
    var stub = <option dangerouslySetInnerHTML={{__html: 'foobar'}} />;
    stub = ReactTestUtils.renderIntoDocument(stub);

    var node = ReactDOM.findDOMNode(stub);
    expect(node.innerHTML).toBe('foobar');
  });

  it('should set attribute for empty value', () => {
    var container = document.createElement('div');
    var option = ReactDOM.render(<option value="" />, container);
    expect(option.hasAttribute('value')).toBe(true);
    expect(option.getAttribute('value')).toBe('');

    ReactDOM.render(<option value="lava" />, container);
    expect(option.hasAttribute('value')).toBe(true);
    expect(option.getAttribute('value')).toBe('lava');
  });

  it('should allow ignoring `value` on option', () => {
    var a = 'a';
    var stub = (
      <select value="giraffe" onChange={() => {}}>
        <option>monkey</option>
        <option>gir{a}ffe</option>
        <option>gorill{a}</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.selectedIndex).toBe(1);

    ReactDOM.render(<select value="gorilla">{options}</select>, container);
    expect(node.selectedIndex).toEqual(2);
  });
});
