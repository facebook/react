/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

function emptyFunction() {}

describe('ReactDOMTextarea', () => {
  let React;
  let ReactDOM;
  let ReactDOMServer;
  let ReactTestUtils;

  let renderTextarea;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');

    renderTextarea = function(component, container) {
      if (!container) {
        container = document.createElement('div');
      }
      const node = ReactDOM.render(component, container);

      // Fixing jsdom's quirky behavior -- in reality, the parser should strip
      // off the leading newline but we need to do it by hand here.
      node.defaultValue = node.innerHTML.replace(/^\n/, '');
      return node;
    };
  });

  it('should allow setting `defaultValue`', () => {
    const container = document.createElement('div');
    const node = renderTextarea(<textarea defaultValue="giraffe" />, container);

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    renderTextarea(<textarea defaultValue="gorilla" />, container);
    expect(node.value).toEqual('giraffe');

    node.value = 'cat';

    renderTextarea(<textarea defaultValue="monkey" />, container);
    expect(node.value).toEqual('cat');
  });

  it('should display `defaultValue` of number 0', () => {
    const stub = <textarea defaultValue={0} />;
    const node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

  it('should display "false" for `defaultValue` of `false`', () => {
    const stub = <textarea defaultValue={false} />;
    const node = renderTextarea(stub);

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', () => {
    const objToString = {
      toString: function() {
        return 'foobar';
      },
    };

    const stub = <textarea defaultValue={objToString} />;
    const node = renderTextarea(stub);

    expect(node.value).toBe('foobar');
  });

  it('should set defaultValue', () => {
    const container = document.createElement('div');
    ReactDOM.render(<textarea defaultValue="foo" />, container);
    ReactDOM.render(<textarea defaultValue="bar" />, container);
    ReactDOM.render(<textarea defaultValue="noise" />, container);
    expect(container.firstChild.defaultValue).toBe('noise');
  });

  it('should not render value as an attribute', () => {
    const stub = <textarea value="giraffe" onChange={emptyFunction} />;
    const node = renderTextarea(stub);

    expect(node.getAttribute('value')).toBe(null);
  });

  it('should display `value` of number 0', () => {
    const stub = <textarea value={0} onChange={emptyFunction} />;
    const node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

  it('should update defaultValue to empty string', () => {
    const container = document.createElement('div');
    ReactDOM.render(<textarea defaultValue={'foo'} />, container);
    ReactDOM.render(<textarea defaultValue={''} />, container);
    expect(container.firstChild.defaultValue).toBe('');
  });

  it('should allow setting `value` to `giraffe`', () => {
    const container = document.createElement('div');
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    const node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value="gorilla" onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('gorilla');
  });

  it('should render defaultValue for SSR', () => {
    const markup = ReactDOMServer.renderToString(<textarea defaultValue="1" />);
    const div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.innerHTML).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should render value for SSR', () => {
    const element = <textarea value="1" onChange={function() {}} />;
    const markup = ReactDOMServer.renderToString(element);
    const div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.innerHTML).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should allow setting `value` to `true`', () => {
    const container = document.createElement('div');
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    const node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={true} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', () => {
    const container = document.createElement('div');
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    const node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={false} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', () => {
    const container = document.createElement('div');
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    const node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    const objToString = {
      toString: function() {
        return 'foo';
      },
    };
    stub = ReactDOM.render(
      <textarea value={objToString} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('foo');
  });

  it('should take updates to `defaultValue` for uncontrolled textarea', () => {
    const container = document.createElement('div');

    const node = ReactDOM.render(<textarea defaultValue="0" />, container);

    expect(node.value).toBe('0');

    ReactDOM.render(<textarea defaultValue="1" />, container);

    expect(node.value).toBe('0');
  });

  it('should take updates to children in lieu of `defaultValue` for uncontrolled textarea', () => {
    const container = document.createElement('div');

    const node = ReactDOM.render(<textarea defaultValue="0" />, container);

    expect(node.value).toBe('0');

    ReactDOM.render(<textarea>1</textarea>, container);

    expect(node.value).toBe('0');
  });

  it('should not incur unnecessary DOM mutations', () => {
    const container = document.createElement('div');
    ReactDOM.render(<textarea value="a" onChange={emptyFunction} />, container);

    const node = container.firstChild;
    let nodeValue = 'a';
    const nodeValueSetter = jest.fn();
    Object.defineProperty(node, 'value', {
      get: function() {
        return nodeValue;
      },
      set: nodeValueSetter.mockImplementation(function(newValue) {
        nodeValue = newValue;
      }),
    });

    ReactDOM.render(<textarea value="a" onChange={emptyFunction} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(0);

    ReactDOM.render(<textarea value="b" onChange={emptyFunction} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(1);
  });

  it('should properly control a value of number `0`', () => {
    const stub = <textarea value={0} onChange={emptyFunction} />;
    const setUntrackedValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    ).set;

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const node = renderTextarea(stub, container);

      setUntrackedValue.call(node, 'giraffe');
      node.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: false}),
      );
      expect(node.value).toBe('0');
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should treat children like `defaultValue`', () => {
    const container = document.createElement('div');
    let stub = <textarea>giraffe</textarea>;
    let node;

    expect(() => {
      node = renderTextarea(stub, container);
    }).toWarnDev(
      'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
    );

    expect(node.value).toBe('giraffe');

    // Changing children should do nothing, it functions like `defaultValue`.
    stub = ReactDOM.render(<textarea>gorilla</textarea>, container);
    expect(node.value).toEqual('giraffe');
  });

  it('should keep value when switching to uncontrolled element if not changed', () => {
    const container = document.createElement('div');

    const node = renderTextarea(
      <textarea value="kitten" onChange={emptyFunction} />,
      container,
    );

    expect(node.value).toBe('kitten');

    ReactDOM.render(<textarea defaultValue="gorilla" />, container);

    expect(node.value).toEqual('kitten');
  });

  it('should keep value when switching to uncontrolled element if changed', () => {
    const container = document.createElement('div');

    const node = renderTextarea(
      <textarea value="kitten" onChange={emptyFunction} />,
      container,
    );

    expect(node.value).toBe('kitten');

    ReactDOM.render(
      <textarea value="puppies" onChange={emptyFunction} />,
      container,
    );

    expect(node.value).toBe('puppies');

    ReactDOM.render(<textarea defaultValue="gorilla" />, container);

    expect(node.value).toEqual('puppies');
  });

  it('should allow numbers as children', () => {
    let node;
    expect(() => {
      node = renderTextarea(<textarea>{17}</textarea>);
    }).toWarnDev(
      'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
    );
    expect(node.value).toBe('17');
  });

  it('should allow booleans as children', () => {
    let node;
    expect(() => {
      node = renderTextarea(<textarea>{false}</textarea>);
    }).toWarnDev(
      'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
    );
    expect(node.value).toBe('false');
  });

  it('should allow objects as children', () => {
    const obj = {
      toString: function() {
        return 'sharkswithlasers';
      },
    };
    let node;
    expect(() => {
      node = renderTextarea(<textarea>{obj}</textarea>);
    }).toWarnDev(
      'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
    );
    expect(node.value).toBe('sharkswithlasers');
  });

  it('should throw with multiple or invalid children', () => {
    expect(() => {
      expect(() =>
        ReactTestUtils.renderIntoDocument(
          <textarea>
            {'hello'}
            {'there'}
          </textarea>,
        ),
      ).toWarnDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
    }).toThrow();

    let node;
    expect(() => {
      expect(
        () =>
          (node = renderTextarea(
            <textarea>
              <strong />
            </textarea>,
          )),
      ).toWarnDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
    }).not.toThrow();

    expect(node.value).toBe('[object Object]');
  });

  it('should unmount', () => {
    const container = document.createElement('div');
    renderTextarea(<textarea />, container);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('should warn if value is null', () => {
    expect(() =>
      ReactTestUtils.renderIntoDocument(<textarea value={null} />),
    ).toWarnDev(
      '`value` prop on `textarea` should not be null. ' +
        'Consider using an empty string to clear the component or `undefined` ' +
        'for uncontrolled components.',
    );

    // No additional warnings are expected
    ReactTestUtils.renderIntoDocument(<textarea value={null} />);
  });

  it('should warn if value and defaultValue are specified', () => {
    expect(() =>
      ReactTestUtils.renderIntoDocument(
        <textarea value="foo" defaultValue="bar" readOnly={true} />,
      ),
    ).toWarnDev(
      'Textarea elements must be either controlled or uncontrolled ' +
        '(specify either the value prop, or the defaultValue prop, but not ' +
        'both). Decide between using a controlled or uncontrolled textarea ' +
        'and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );

    // No additional warnings are expected
    ReactTestUtils.renderIntoDocument(
      <textarea value="foo" defaultValue="bar" readOnly={true} />,
    );
  });

  it('should not warn about missing onChange in uncontrolled textareas', () => {
    const container = document.createElement('div');
    ReactDOM.render(<textarea />, container);
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<textarea value={undefined} />, container);
  });
});
