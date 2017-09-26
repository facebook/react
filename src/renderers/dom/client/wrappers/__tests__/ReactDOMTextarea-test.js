/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var emptyFunction = require('emptyFunction');

describe('ReactDOMTextarea', () => {
  var React;
  var ReactDOM;
  var ReactDOMServer;
  var ReactLink;
  var ReactTestUtils;

  var renderTextarea;

  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMServer = require('ReactDOMServer');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');

    renderTextarea = function(component, container) {
      if (!container) {
        container = document.createElement('div');
      }
      var node = ReactDOM.render(component, container);

      // Fixing jsdom's quirky behavior -- in reality, the parser should strip
      // off the leading newline but we need to do it by hand here.
      node.defaultValue = node.innerHTML.replace(/^\n/, '');
      return node;
    };
  });

  it('should allow setting `defaultValue`', () => {
    var container = document.createElement('div');
    var node = renderTextarea(<textarea defaultValue="giraffe" />, container);

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    renderTextarea(<textarea defaultValue="gorilla" />, container);
    expect(node.value).toEqual('giraffe');

    node.value = 'cat';

    renderTextarea(<textarea defaultValue="monkey" />, container);
    expect(node.value).toEqual('cat');
  });

  it('should display `defaultValue` of number 0', () => {
    var stub = <textarea defaultValue={0} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

  it('should display "false" for `defaultValue` of `false`', () => {
    var stub = <textarea defaultValue={false} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', () => {
    var objToString = {
      toString: function() {
        return 'foobar';
      },
    };

    var stub = <textarea defaultValue={objToString} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('foobar');
  });

  it('should set defaultValue', () => {
    var container = document.createElement('div');
    ReactDOM.render(<textarea defaultValue="foo" />, container);
    ReactDOM.render(<textarea defaultValue="bar" />, container);
    ReactDOM.render(<textarea defaultValue="noise" />, container);
    expect(container.firstChild.defaultValue).toBe('noise');
  });

  it('should not render value as an attribute', () => {
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    var node = renderTextarea(stub);

    expect(node.getAttribute('value')).toBe(null);
  });

  it('should display `value` of number 0', () => {
    var stub = <textarea value={0} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

  it('should update defaultValue to empty string', () => {
    var container = document.createElement('div');
    ReactDOM.render(<textarea defaultValue={'foo'} />, container);
    ReactDOM.render(<textarea defaultValue={''} />, container);
    expect(container.firstChild.defaultValue).toBe('');
  });

  it('should allow setting `value` to `giraffe`', () => {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    var node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value="gorilla" onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('gorilla');
  });

  it('should render defaultValue for SSR', () => {
    var markup = ReactDOMServer.renderToString(<textarea defaultValue="1" />);
    var div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.innerHTML).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should render value for SSR', () => {
    var element = <textarea value="1" onChange={function() {}} />;
    var markup = ReactDOMServer.renderToString(element);
    var div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.innerHTML).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should allow setting `value` to `true`', () => {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    var node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={true} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', () => {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    var node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={false} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', () => {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    var node = renderTextarea(stub, container);

    expect(node.value).toBe('giraffe');

    var objToString = {
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
    var container = document.createElement('div');

    var node = ReactDOM.render(<textarea defaultValue="0" />, container);

    expect(node.value).toBe('0');

    ReactDOM.render(<textarea defaultValue="1" />, container);

    expect(node.value).toBe('0');
  });

  it('should take updates to children in lieu of `defaultValue` for uncontrolled textarea', () => {
    var container = document.createElement('div');

    var node = ReactDOM.render(<textarea defaultValue="0" />, container);

    expect(node.value).toBe('0');

    spyOn(console, 'error'); // deprecation warning for `children` content

    ReactDOM.render(<textarea>1</textarea>, container);

    expect(node.value).toBe('0');
  });

  it('should not incur unnecessary DOM mutations', () => {
    var container = document.createElement('div');
    ReactDOM.render(<textarea value="a" onChange={emptyFunction} />, container);

    var node = container.firstChild;
    var nodeValue = 'a';
    var nodeValueSetter = jest.genMockFn();
    Object.defineProperty(node, 'value', {
      get: function() {
        return nodeValue;
      },
      set: nodeValueSetter.mockImplementation(function(newValue) {
        nodeValue = newValue;
      }),
    });

    ReactDOM.render(<textarea value="a" onChange={emptyFunction} />, container);
    expect(nodeValueSetter.mock.calls.length).toBe(0);

    ReactDOM.render(<textarea value="b" onChange={emptyFunction} />, container);
    expect(nodeValueSetter.mock.calls.length).toBe(1);
  });

  it('should properly control a value of number `0`', () => {
    var stub = <textarea value={0} onChange={emptyFunction} />;
    var node = renderTextarea(stub);

    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);
    expect(node.value).toBe('0');
  });

  it('should treat children like `defaultValue`', () => {
    spyOn(console, 'error');

    var container = document.createElement('div');
    var stub = <textarea>giraffe</textarea>;
    var node = renderTextarea(stub, container);

    expect(console.error.calls.count()).toBe(1);
    expect(node.value).toBe('giraffe');

    // Changing children should do nothing, it functions like `defaultValue`.
    stub = ReactDOM.render(<textarea>gorilla</textarea>, container);
    expect(node.value).toEqual('giraffe');
  });

  it('should keep value when switching to uncontrolled element if not changed', () => {
    var container = document.createElement('div');

    var node = renderTextarea(
      <textarea value="kitten" onChange={emptyFunction} />,
      container,
    );

    expect(node.value).toBe('kitten');

    ReactDOM.render(<textarea defaultValue="gorilla" />, container);

    expect(node.value).toEqual('kitten');
  });

  it('should keep value when switching to uncontrolled element if changed', () => {
    var container = document.createElement('div');

    var node = renderTextarea(
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
    spyOn(console, 'error');
    var node = renderTextarea(<textarea>{17}</textarea>);
    expect(console.error.calls.count()).toBe(1);
    expect(node.value).toBe('17');
  });

  it('should allow booleans as children', () => {
    spyOn(console, 'error');
    var node = renderTextarea(<textarea>{false}</textarea>);
    expect(console.error.calls.count()).toBe(1);
    expect(node.value).toBe('false');
  });

  it('should allow objects as children', () => {
    spyOn(console, 'error');
    var obj = {
      toString: function() {
        return 'sharkswithlasers';
      },
    };
    var node = renderTextarea(<textarea>{obj}</textarea>);
    expect(console.error.calls.count()).toBe(1);
    expect(node.value).toBe('sharkswithlasers');
  });

  it('should throw with multiple or invalid children', () => {
    spyOn(console, 'error');

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <textarea>{'hello'}{'there'}</textarea>,
      );
    }).toThrow();

    expect(console.error.calls.count()).toBe(1);

    var node;
    expect(function() {
      node = renderTextarea(<textarea><strong /></textarea>);
    }).not.toThrow();

    expect(node.value).toBe('[object Object]');

    expect(console.error.calls.count()).toBe(2);
  });

  it('should support ReactLink', () => {
    var link = new ReactLink('yolo', jest.fn());
    var instance = <textarea valueLink={link} />;

    spyOn(console, 'error');
    instance = renderTextarea(instance);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`valueLink` prop on `textarea` is deprecated; set `value` and `onChange` instead.',
    );

    expect(instance.value).toBe('yolo');
    expect(link.value).toBe('yolo');
    expect(link.requestChange.mock.calls.length).toBe(0);

    instance.value = 'test';
    ReactTestUtils.Simulate.change(instance);

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('test');
  });

  it('should unmount', () => {
    var container = document.createElement('div');
    renderTextarea(<textarea />, container);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('should warn if value is null', () => {
    spyOn(console, 'error');

    ReactTestUtils.renderIntoDocument(<textarea value={null} />);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`value` prop on `textarea` should not be null. ' +
        'Consider using the empty string to clear the component or `undefined` ' +
        'for uncontrolled components.',
    );

    ReactTestUtils.renderIntoDocument(<textarea value={null} />);
    expect(console.error.calls.count()).toBe(1);
  });

  it('should warn if value and defaultValue are specified', () => {
    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(
      <textarea value="foo" defaultValue="bar" readOnly={true} />,
    );
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Textarea elements must be either controlled or uncontrolled ' +
        '(specify either the value prop, or the defaultValue prop, but not ' +
        'both). Decide between using a controlled or uncontrolled textarea ' +
        'and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );

    ReactTestUtils.renderIntoDocument(
      <textarea value="foo" defaultValue="bar" readOnly={true} />,
    );
    expect(console.error.calls.count()).toBe(1);
  });
});
