/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMOption', () => {
  let React;
  let ReactDOM;
  let ReactTestUtils;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should flatten children to a string', () => {
    const stub = (
      <option>
        {1} {'foo'}
      </option>
    );
    const node = ReactTestUtils.renderIntoDocument(stub);

    expect(node.innerHTML).toBe('1 foo');
  });

  it('should ignore and warn invalid children types', () => {
    const el = (
      <option>
        {1} <div /> {2}
      </option>
    );
    let node;
    expect(() => {
      node = ReactTestUtils.renderIntoDocument(el);
    }).toErrorDev(
      'Only strings and numbers are supported as <option> children.\n' +
        '    in option (at **)',
    );
    expect(node.innerHTML).toBe('1 [object Object] 2');
    ReactTestUtils.renderIntoDocument(el);
  });

  it('should ignore null/undefined/false children without warning', () => {
    const stub = (
      <option>
        {1} {false}
        {true}
        {null}
        {undefined} {2}
      </option>
    );
    const node = ReactTestUtils.renderIntoDocument(stub);

    expect(node.innerHTML).toBe('1  2');
  });

  it('should throw on object children', () => {
    expect(() => {
      ReactTestUtils.renderIntoDocument(<option>{{}}</option>);
    }).toThrow('Objects are not valid as a React child');
    expect(() => {
      ReactTestUtils.renderIntoDocument(<option>{[{}]}</option>);
    }).toThrow('Objects are not valid as a React child');
    expect(() => {
      ReactTestUtils.renderIntoDocument(
        <option>
          {{}}
          <span />
        </option>,
      );
    }).toThrow('Objects are not valid as a React child');
    expect(() => {
      ReactTestUtils.renderIntoDocument(
        <option>
          {'1'}
          {{}}
          {2}
        </option>,
      );
    }).toThrow('Objects are not valid as a React child');
  });

  it('should support element-ish child', () => {
    // This is similar to <fbt>.
    // It's important that we toString it.
    const obj = {
      $$typeof: Symbol.for('react.element'),
      type: props => props.content,
      ref: null,
      key: null,
      props: {
        content: 'hello',
      },
      toString() {
        return this.props.content;
      },
    };

    let node = ReactTestUtils.renderIntoDocument(<option>{obj}</option>);
    expect(node.innerHTML).toBe('hello');

    node = ReactTestUtils.renderIntoDocument(<option>{[obj]}</option>);
    expect(node.innerHTML).toBe('hello');

    expect(() => {
      node = ReactTestUtils.renderIntoDocument(
        <option>
          {obj}
          <span />
        </option>,
      );
    }).toErrorDev(
      'Only strings and numbers are supported as <option> children.',
    );
    expect(node.innerHTML).toBe('hello[object Object]');

    node = ReactTestUtils.renderIntoDocument(
      <option>
        {'1'}
        {obj}
        {2}
      </option>,
    );
    expect(node.innerHTML).toBe('1hello2');
  });

  it('should be able to use dangerouslySetInnerHTML on option', () => {
    const stub = <option dangerouslySetInnerHTML={{__html: 'foobar'}} />;
    const node = ReactTestUtils.renderIntoDocument(stub);

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
    const stub = (
      <select value="giraffe" onChange={() => {}}>
        <option>monkey</option>
        <option>gir{a}ffe</option>
        <option>gorill{a}</option>
      </select>
    );
    const options = stub.props.children;
    const container = document.createElement('div');
    const node = ReactDOM.render(stub, container);

    expect(node.selectedIndex).toBe(1);

    ReactDOM.render(<select value="gorilla">{options}</select>, container);
    expect(node.selectedIndex).toEqual(2);
  });
});
