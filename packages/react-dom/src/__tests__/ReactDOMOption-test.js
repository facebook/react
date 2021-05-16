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
  let ReactDOMServer;
  let ReactTestUtils;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
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

  it('should warn for invalid child tags', () => {
    const el = (
      <option value="12">
        {1} <div /> {2}
      </option>
    );
    let node;
    expect(() => {
      node = ReactTestUtils.renderIntoDocument(el);
    }).toErrorDev(
      'validateDOMNesting(...): <div> cannot appear as a child of <option>.\n' +
        '    in div (at **)\n' +
        '    in option (at **)',
    );
    expect(node.innerHTML).toBe('1 <div></div> 2');
    ReactTestUtils.renderIntoDocument(el);
  });

  it('should warn for component child if no value prop is provided', () => {
    function Foo() {
      return '2';
    }
    const el = (
      <option>
        {1} <Foo /> {3}
      </option>
    );
    let node;
    expect(() => {
      node = ReactTestUtils.renderIntoDocument(el);
    }).toErrorDev(
      'Cannot infer the option value of complex children. ' +
        'Pass a `value` prop or use a plain string as children to <option>.',
    );
    expect(node.innerHTML).toBe('1 2 3');
    ReactTestUtils.renderIntoDocument(el);
  });

  it('should not warn for component child if value prop is provided', () => {
    function Foo() {
      return '2';
    }
    const el = (
      <option value="123">
        {1} <Foo /> {3}
      </option>
    );
    const node = ReactTestUtils.renderIntoDocument(el);
    expect(node.innerHTML).toBe('1 2 3');
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
    // We don't toString it because you must instead provide a value prop.
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

    let node = ReactTestUtils.renderIntoDocument(
      <option value="a">{obj}</option>,
    );
    expect(node.innerHTML).toBe('hello');

    node = ReactTestUtils.renderIntoDocument(
      <option value="b">{[obj]}</option>,
    );
    expect(node.innerHTML).toBe('hello');

    node = ReactTestUtils.renderIntoDocument(
      <option value={obj}>{obj}</option>,
    );
    expect(node.innerHTML).toBe('hello');
    expect(node.value).toBe('hello');

    node = ReactTestUtils.renderIntoDocument(
      <option value={obj}>
        {'1'}
        {obj}
        {2}
      </option>,
    );
    expect(node.innerHTML).toBe('1hello2');
    expect(node.value).toBe('hello');
  });

  it('should be able to use dangerouslySetInnerHTML on option', () => {
    const stub = <option dangerouslySetInnerHTML={{__html: 'foobar'}} />;
    let node;
    expect(() => {
      node = ReactTestUtils.renderIntoDocument(stub);
    }).toErrorDev(
      'Pass a `value` prop if you set dangerouslyInnerHTML so React knows which value should be selected.\n' +
        '    in option (at **)',
    );

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

  it('generates a warning and hydration error when an invalid nested tag is used as a child', () => {
    const ref = React.createRef();
    const children = (
      <select readOnly={true} value="bar">
        <option value="bar">
          {['Bar', false, 'Foo', <div key="1" ref={ref} />, 'Baz']}
        </option>
      </select>
    );

    const container = document.createElement('div');

    container.innerHTML = ReactDOMServer.renderToString(children);

    expect(container.firstChild.getAttribute('value')).toBe(null);
    expect(container.firstChild.getAttribute('defaultValue')).toBe(null);

    const option = container.firstChild.firstChild;
    expect(option.nodeName).toBe('OPTION');

    expect(option.textContent).toBe('BarFooBaz');
    expect(option.selected).toBe(true);

    expect(() => ReactDOM.hydrate(children, container)).toErrorDev([
      'Text content did not match. Server: "FooBaz" Client: "Foo"',
      'validateDOMNesting(...): <div> cannot appear as a child of <option>.',
    ]);

    expect(option.textContent).toBe('BarFooBaz');
    expect(option.selected).toBe(true);

    expect(ref.current.nodeName).toBe('DIV');
    expect(ref.current.parentNode).toBe(option);
  });
});
