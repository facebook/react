/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMOption', () => {
  var React;
  var ReactDOM;
  var ReactTestUtils;

  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
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
    var stub = <option>{1} <div /> {2}</option>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);
    expect(node.innerHTML).toBe('1  2');
    ReactTestUtils.renderIntoDocument(<option>{1} <div /> {2}</option>);
    // only warn once
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Only strings and numbers are supported as <option> children.',
    );
  });

  it('should ignore null/undefined/false children without warning', () => {
    var stub = <option>{1} {false}{true}{null}{undefined} {2}</option>;
    spyOn(console, 'error');
    stub = ReactTestUtils.renderIntoDocument(stub);

    var node = ReactDOM.findDOMNode(stub);

    expect(console.error.calls.count()).toBe(0);
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
