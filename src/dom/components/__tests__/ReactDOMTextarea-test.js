/**
 * Copyright 2013 Facebook, Inc.
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

describe('ReactDOMTextarea', function() {
  var React;
  var ReactTestUtils;

  var renderTextarea;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    renderTextarea = function(component) {
      var stub = ReactTestUtils.renderIntoDocument(component);
      var node = stub.getDOMNode();
      // Polyfilling the browser's quirky behavior.
      node.value = node.innerHTML;
      return node;
    };
  });

  it('should allow setting `defaultValue`', function() {
    var stub = <textarea defaultValue="giraffe" />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    stub.replaceProps({defaultValue: 'gorilla'});
    expect(node.value).toEqual('giraffe');
  });

  it('should display `defaultValue` of number 0', function() {
    var stub = <textarea defaultValue={0} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

  it('should allow setting `value`', function() {
    var stub = <textarea value="giraffe" />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('giraffe');

    stub.replaceProps({value: 'gorilla'});
    expect(node.value).toEqual('gorilla');
  });

  it('should display `value` of number 0', function() {
    var stub = <textarea value={0} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

  it('should treat children like `defaultValue`', function() {
    spyOn(console, 'warn');

    var stub = <textarea>giraffe</textarea>;
    var node = renderTextarea(stub);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(node.value).toBe('giraffe');

    // Changing children should do nothing, it functions like `defaultValue`.
    stub.replaceProps({children: 'gorilla'});
    expect(node.value).toEqual('giraffe');
  });

  it('should allow numbers as children', function() {
    spyOn(console, 'warn');
    var node = renderTextarea(<textarea>{17}</textarea>);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(node.value).toBe('17');
  });

  it("should throw with multiple or invalid children", function() {
    spyOn(console, 'warn');

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <textarea>{'hello'}{'there'}</textarea>
      );
    }).toThrow();

    expect(console.warn.argsForCall.length).toBe(1);

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <textarea><strong /></textarea>
      );
    }).toThrow();

    expect(console.warn.argsForCall.length).toBe(2);
  });
});

describe('ReactDOMInput', function() {
  var React;
  var ReactTestUtils;

  var renderTextarea;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    renderTextarea = function(component) {
      var stub = ReactTestUtils.renderIntoDocument(component);
      var node = stub.getDOMNode();
      return node;
    };
  });

  it('should display `defaultValue` of number 0', function() {
    var stub = <input type="text" defaultValue={0} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

  it('should display `value` of number 0', function() {
    var stub = <input type="text" value={0} />;
    var node = renderTextarea(stub);

    expect(node.value).toBe('0');
  });

});
