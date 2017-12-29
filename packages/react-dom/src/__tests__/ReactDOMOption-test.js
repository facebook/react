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
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  let React;
  let ReactDOM;
  let ReactTestUtils;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should flatten children to a string', () => {
    let stub = (
      <option>
        {1} {'foo'}
      </option>
    );
    stub = ReactTestUtils.renderIntoDocument(stub);
    const node = ReactDOM.findDOMNode(stub);

    expect(node.innerHTML).toBe('1 foo');
  });

  it('should ignore and warn invalid children types', () => {
    spyOnDev(console, 'error');
    const el = (
      <option>
        {1} <div /> {2}
      </option>
    );
    const node = ReactTestUtils.renderIntoDocument(el);
    expect(node.innerHTML).toBe('1  2');
    ReactTestUtils.renderIntoDocument(el);
    if (__DEV__) {
      // only warn once
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toContain(
        '<div> cannot appear as a child of <option>.\n' +
          '    in div (at **)\n' +
          '    in option (at **)',
      );
    }
  });

  it('should ignore null/undefined/false children without warning', () => {
    let stub = (
      <option>
        {1} {false}
        {true}
        {null}
        {undefined} {2}
      </option>
    );
    spyOnDev(console, 'error');
    stub = ReactTestUtils.renderIntoDocument(stub);

    const node = ReactDOM.findDOMNode(stub);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(0);
    }
    expect(node.innerHTML).toBe('1  2');
  });

  it('should be able to use dangerouslySetInnerHTML on option', () => {
    let stub = <option dangerouslySetInnerHTML={{__html: 'foobar'}} />;
    stub = ReactTestUtils.renderIntoDocument(stub);

    const node = ReactDOM.findDOMNode(stub);
    expect(node.innerHTML).toBe('foobar');
  });

  it('should set attribute for empty value', () => {
    const container = document.createElement('div');
    const option = ReactDOM.render(<option value="" />, container);
    expect(option.hasAttribute('value')).toBe(true);
    expect(option.getAttribute('value')).toBe('');

    ReactDOM.render(<option value="lava" />, container);
    expect(option.hasAttribute('value')).toBe(true);
    expect(option.getAttribute('value')).toBe('lava');
  });

  it('should allow ignoring `value` on option', () => {
    const a = 'a';
    let stub = (
      <select value="giraffe" onChange={() => {}}>
        <option>monkey</option>
        <option>gir{a}ffe</option>
        <option>gorill{a}</option>
      </select>
    );
    const options = stub.props.children;
    const container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    const node = ReactDOM.findDOMNode(stub);

    expect(node.selectedIndex).toBe(1);

    ReactDOM.render(<select value="gorilla">{options}</select>, container);
    expect(node.selectedIndex).toEqual(2);
  });
});
