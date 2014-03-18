/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

/*jshint evil:true */

var mocks = require('mocks');

describe('ReactDOMTextarea', () => {
  var React;
  var ReactLink;
  var ReactTestUtils;

  var renderTextarea;

  beforeEach(() => {
    React = require('React');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');

    renderTextarea = function(component) {
      var stub = ReactTestUtils.renderIntoDocument(component);
      var node = stub.getDOMNode();
      // Polyfilling the browser's quirky behavior.
      node.value = node.innerHTML;
      return stub;
    };
  });

  it('should allow setting `defaultValue`', () => {
    var stub = <textarea defaultValue="giraffe" />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    stub.replaceProps({defaultValue: 'gorilla'});
    expect(node.value).toEqual('giraffe');
  });

  it('should display `defaultValue` of number 0', () => {
    var stub = <textarea defaultValue={0} />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('0');
  });

  it('should display "false" for `defaultValue` of `false`', () => {
    var stub = <textarea type="text" defaultValue={false} />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', () => {
    var objToString = {
      toString: function() {
        return "foobar";
      }
    };

    var stub = <textarea type="text" defaultValue={objToString} />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('foobar');
  });

  it('should display `value` of number 0', () => {
    var stub = <textarea value={0} />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('0');
  });

  it('should allow setting `value` to `giraffe`', () => {
    var stub = <textarea value="giraffe" />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    stub.replaceProps({value: 'gorilla'});
    expect(node.value).toEqual('gorilla');
  });

  it('should allow setting `value` to `true`', () => {
    var stub = <textarea value="giraffe" />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    stub.replaceProps({value: true});
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', () => {
    var stub = <textarea value="giraffe" />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    stub.replaceProps({value: false});
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', () => {
    var stub = <textarea value="giraffe" />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    var objToString = {
      toString: function() {
        return "foo";
      }
    };
    stub.replaceProps({value: objToString});
    expect(node.value).toEqual('foo');
  });

  it('should properly control a value of number `0`', () => {
    var stub = <textarea value={0} />;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);
    expect(node.value).toBe('0');
  });

  it('should treat children like `defaultValue`', () => {
    spyOn(console, 'warn');

    var stub = <textarea>giraffe</textarea>;
    stub = renderTextarea(stub);
    var node = stub.getDOMNode();

    expect(console.warn.argsForCall.length).toBe(1);
    expect(node.value).toBe('giraffe');

    // Changing children should do nothing, it functions like `defaultValue`.
    stub.replaceProps({children: 'gorilla'});
    expect(node.value).toEqual('giraffe');
  });

  it('should allow numbers as children', () => {
    spyOn(console, 'warn');
    var node = renderTextarea(<textarea>{17}</textarea>).getDOMNode();
    expect(console.warn.argsForCall.length).toBe(1);
    expect(node.value).toBe('17');
  });

  it('should allow booleans as children', () => {
    spyOn(console, 'warn');
    var node = renderTextarea(<textarea>{false}</textarea>).getDOMNode();
    expect(console.warn.argsForCall.length).toBe(1);
    expect(node.value).toBe('false');
  });

  it('should allow objects as children', () => {
    spyOn(console, 'warn');
    var obj = {
      toString: function() {
        return "sharkswithlasers";
      }
    };
    var node = renderTextarea(<textarea>{obj}</textarea>).getDOMNode();
    expect(console.warn.argsForCall.length).toBe(1);
    expect(node.value).toBe('sharkswithlasers');
  });

  it('should throw with multiple or invalid children', () => {
    spyOn(console, 'warn');

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <textarea>{'hello'}{'there'}</textarea>
      );
    }).toThrow();

    expect(console.warn.argsForCall.length).toBe(1);

    var node;
    expect(function() {
      node = renderTextarea(<textarea><strong /></textarea>).getDOMNode();
    }).not.toThrow();

    expect(node.value).toBe('[object Object]');

    expect(console.warn.argsForCall.length).toBe(2);
  });

  it('should support ReactLink', () => {
    var container = document.createElement('div');
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <textarea valueLink={link} />;

    instance = React.renderComponent(instance, container);

    expect(instance.getDOMNode().value).toBe('yolo');
    expect(link.value).toBe('yolo');
    expect(link.requestChange.mock.calls.length).toBe(0);

    instance.getDOMNode().value = 'test';
    ReactTestUtils.Simulate.change(instance.getDOMNode());

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('test');
  });
});
