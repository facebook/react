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

var emptyFunction = require('emptyFunction');

describe('ReactDOMTextarea', function() {
  var React;
  var ReactDOM;
  var ReactLink;
  var ReactTestUtils;

  var renderTextarea;

  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');

    renderTextarea = function(component, container, skipReplace) {
      if (!container) {
        container = document.createElement('div');
      }
      var stub = ReactDOM.render(component, container);
      var node = ReactDOM.findDOMNode(stub);

      if (!skipReplace) {
        // Fixing jsdom's quirky behavior -- in reality, the parser should strip
        // off the leading newline but we need to do it by hand here.
        node.value = node.innerHTML.replace(/^\n/, '');
      }
      return stub;
    };
  });

  it('should allow setting `defaultValue`', function() {
    var container = document.createElement('div');
    var stub = renderTextarea(<textarea defaultValue="giraffe" />, container, true);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should change if no value set.
    stub = renderTextarea(<textarea defaultValue="gorilla" />, container, true);
    expect(node.value).toEqual('gorilla');

    node.value = 'cat';

    stub = renderTextarea(<textarea defaultValue="monkey" />, container, true);
    expect(node.value).toEqual('cat');
  });

  it('should display `defaultValue` of number 0', function() {
    var stub = <textarea defaultValue={0} />;
    stub = renderTextarea(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('0');
  });

  it('should display "false" for `defaultValue` of `false`', function() {
    var stub = <textarea defaultValue={false} />;
    stub = renderTextarea(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', function() {
    var objToString = {
      toString: function() {
        return 'foobar';
      },
    };

    var stub = <textarea defaultValue={objToString} />;
    stub = renderTextarea(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('foobar');
  });

  it('should not render value as an attribute', function() {
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    stub = renderTextarea(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.getAttribute('value')).toBe(null);
  });

  it('should display `value` of number 0', function() {
    var stub = <textarea value={0} />;
    stub = renderTextarea(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('0');
  });

  it('should allow setting `value` to `giraffe`', function() {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    stub = renderTextarea(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value="gorilla" onChange={emptyFunction} />,
      container
    );
    expect(node.value).toEqual('gorilla');
  });

  it('should allow setting `value` to `true`', function() {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    stub = renderTextarea(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={true} onChange={emptyFunction} />,
      container
    );
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', function() {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    stub = renderTextarea(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={false} onChange={emptyFunction} />,
      container
    );
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', function() {
    var container = document.createElement('div');
    var stub = <textarea value="giraffe" onChange={emptyFunction} />;
    stub = renderTextarea(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    var objToString = {
      toString: function() {
        return 'foo';
      },
    };
    stub = ReactDOM.render(
      <textarea value={objToString} onChange={emptyFunction} />,
      container
    );
    expect(node.value).toEqual('foo');
  });

  it('should take updates to `defaultValue` for uncontrolled textarea', function() {
    var container = document.createElement('div');

    var el = ReactDOM.render(<textarea type="text" defaultValue="0" />, container);
    var node = ReactDOM.findDOMNode(el);

    expect(node.value).toBe('0');

    ReactDOM.render(<textarea type="text" defaultValue="1" />, container);

    expect(node.value).toBe('1');
  });

  it('should take updates to children in lieu of `defaultValue` for uncontrolled textarea', function() {
    var container = document.createElement('div');

    var el = ReactDOM.render(<textarea type="text" defaultValue="0" />, container);
    var node = ReactDOM.findDOMNode(el);

    expect(node.value).toBe('0');

    spyOn(console, 'error'); // deprecation warning for `children` content

    ReactDOM.render(<textarea type="text">1</textarea>, container);

    expect(node.value).toBe('1');
  });

  it('should not incur unnecessary DOM mutations', function() {
    var container = document.createElement('div');
    ReactDOM.render(<textarea value="a" onChange={emptyFunction} />, container);

    var node = container.firstChild;
    var nodeValue = 'a'; // node.value always returns undefined
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

  it('should properly control a value of number `0`', function() {
    var stub = <textarea value={0} onChange={emptyFunction} />;
    stub = renderTextarea(stub);
    var node = ReactDOM.findDOMNode(stub);

    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);
    expect(node.value).toBe('0');
  });

  it('should treat children like `defaultValue`', function() {
    spyOn(console, 'error');

    var container = document.createElement('div');
    var stub = <textarea>giraffe</textarea>;
    stub = renderTextarea(stub, container, true);
    var node = ReactDOM.findDOMNode(stub);

    expect(console.error.argsForCall.length).toBe(1);
    expect(node.value).toBe('giraffe');

    // Changing children should cause value to change (new behavior of `defaultValue`)
    stub = ReactDOM.render(<textarea>gorilla</textarea>, container);
    expect(node.value).toEqual('gorilla');
  });

  it('should not keep value when switching to uncontrolled element if not changed', function() {
    var container = document.createElement('div');

    var stub = renderTextarea(<textarea value="kitten" onChange={emptyFunction} />, container, true);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('kitten');

    ReactDOM.render(<textarea defaultValue="gorilla"></textarea>, container);

    expect(node.value).toEqual('gorilla');
  });

  it('should keep value when switching to uncontrolled element if changed', function() {
    var container = document.createElement('div');

    var stub = renderTextarea(<textarea value="kitten" onChange={emptyFunction} />, container, true);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('kitten');

    ReactDOM.render(<textarea value="puppies" onChange={emptyFunction}></textarea>, container);

    expect(node.value).toBe('puppies');

    ReactDOM.render(<textarea defaultValue="gorilla"></textarea>, container);

    expect(node.value).toEqual('puppies');
  });

  it('should allow numbers as children', function() {
    spyOn(console, 'error');
    var node = ReactDOM.findDOMNode(renderTextarea(<textarea>{17}</textarea>));
    expect(console.error.argsForCall.length).toBe(1);
    expect(node.value).toBe('17');
  });

  it('should allow booleans as children', function() {
    spyOn(console, 'error');
    var node = ReactDOM.findDOMNode(renderTextarea(<textarea>{false}</textarea>));
    expect(console.error.argsForCall.length).toBe(1);
    expect(node.value).toBe('false');
  });

  it('should allow objects as children', function() {
    spyOn(console, 'error');
    var obj = {
      toString: function() {
        return 'sharkswithlasers';
      },
    };
    var node = ReactDOM.findDOMNode(renderTextarea(<textarea>{obj}</textarea>));
    expect(console.error.argsForCall.length).toBe(1);
    expect(node.value).toBe('sharkswithlasers');
  });

  it('should throw with multiple or invalid children', function() {
    spyOn(console, 'error');

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <textarea>{'hello'}{'there'}</textarea>
      );
    }).toThrow();

    expect(console.error.argsForCall.length).toBe(1);

    var node;
    expect(function() {
      node = ReactDOM.findDOMNode(renderTextarea(<textarea><strong /></textarea>));
    }).not.toThrow();

    expect(node.value).toBe('[object Object]');

    expect(console.error.argsForCall.length).toBe(2);
  });

  it('should support ReactLink', function() {
    var link = new ReactLink('yolo', jest.genMockFn());
    var instance = <textarea valueLink={link} />;

    spyOn(console, 'error');
    instance = renderTextarea(instance);
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      '`valueLink` prop on `textarea` is deprecated; set `value` and `onChange` instead.'
    );


    expect(ReactDOM.findDOMNode(instance).value).toBe('yolo');
    expect(link.value).toBe('yolo');
    expect(link.requestChange.mock.calls.length).toBe(0);

    ReactDOM.findDOMNode(instance).value = 'test';
    ReactTestUtils.Simulate.change(ReactDOM.findDOMNode(instance));

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('test');
  });

  it('should unmount', function() {
    var container = document.createElement('div');
    renderTextarea(<textarea />, container);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('should warn if value is null', function() {
    spyOn(console, 'error');

    ReactTestUtils.renderIntoDocument(<textarea value={null} />);
    expect(console.error.argsForCall[0][0]).toContain(
      '`value` prop on `textarea` should not be null. ' +
      'Consider using the empty string to clear the component or `undefined` ' +
      'for uncontrolled components.'
    );

    ReactTestUtils.renderIntoDocument(<textarea value={null} />);
    expect(console.error.argsForCall.length).toBe(1);
  });

  it('should warn if value and defaultValue are specified', function() {
    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(
      <textarea value="foo" defaultValue="bar" readOnly={true} />
    );
    expect(console.error.argsForCall[0][0]).toContain(
      'Textarea elements must be either controlled or uncontrolled ' +
      '(specify either the value prop, or the defaultValue prop, but not ' +
      'both). Decide between using a controlled or uncontrolled textarea ' +
      'and remove one of these props. More info: ' +
      'https://fb.me/react-controlled-components'
    );

    ReactTestUtils.renderIntoDocument(
      <textarea value="foo" defaultValue="bar" readOnly={true} />
    );
    expect(console.error.argsForCall.length).toBe(1);
  });

});
