/**
 * Copyright 2013-2015, Facebook, Inc.
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
var mocks = require('mocks');

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

    renderTextarea = function(component, container) {
      if (!container) {
        container = document.createElement('div');
      }
      var stub = ReactDOM.render(component, container);
      var node = ReactDOM.findDOMNode(stub);
      // Fixing jsdom's quirky behavior -- in reality, the parser should strip
      // off the leading newline but we need to do it by hand here.
      node.value = node.innerHTML.replace(/^\n/, '');
      return stub;
    };
  });

  it('should allow setting `defaultValue`', function() {
    var container = document.createElement('div');
    var stub = renderTextarea(<textarea defaultValue="giraffe" />, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    stub = renderTextarea(<textarea defaultValue="gorilla" />, container);
    expect(node.value).toEqual('giraffe');
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
    stub = renderTextarea(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(console.error.argsForCall.length).toBe(1);
    expect(node.value).toBe('giraffe');

    // Changing children should do nothing, it functions like `defaultValue`.
    stub = ReactDOM.render(<textarea>gorilla</textarea>, container);
    expect(node.value).toEqual('giraffe');
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
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <textarea valueLink={link} />;

    instance = renderTextarea(instance);

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
});
