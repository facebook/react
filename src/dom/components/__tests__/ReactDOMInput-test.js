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

var emptyFunction = require('emptyFunction');
var mocks = require('mocks');

describe('ReactDOMInput', function() {
  var React;
  var ReactLink;
  var ReactTestUtils;

  var renderTextInput;

  beforeEach(function() {
    React = require('React');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');

    renderTextInput = function(component) {
      var stub = ReactTestUtils.renderIntoDocument(component);
      var node = stub.getDOMNode();
      return node;
    };
  });

  it('should display `defaultValue` of number 0', function() {
    var stub = <input type="text" defaultValue={0} />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('0');
  });

  it('should display "true" for `defaultValue` of `true`', function() {
    var stub = <input type="text" defaultValue={true} />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('true');
  });

  it('should display "false" for `defaultValue` of `false`', function() {
    var stub = <input type="text" defaultValue={false} />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', function() {
    var objToString = {
      toString: function() {
        return "foobar";
      }
    };

    var stub = <input type="text" defaultValue={objToString} />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('foobar');
  });

  it('should display `value` of number 0', function() {
    var stub = <input type="text" value={0} />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('0');
  });

  it('should allow setting `value` to `true`', function() {
    var stub = <input type="text" value="yolo" />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('yolo');

    stub.replaceProps({value: true});
    expect(node.value).toEqual('true');
  });

  it("should allow setting `value` to `false`", function() {
    var stub = <input type="text" value="yolo" />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('yolo');

    stub.replaceProps({value: false});
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', function() {
    var stub = <input type="text" value="foo" />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('foo');

    var objToString = {
      toString: function() {
        return "foobar";
      }
    };

    stub.replaceProps({value: objToString});
    expect(node.value).toEqual('foobar');
  });

  it('should properly control a value of number `0`', function() {
    var stub = <input type="text" value={0} />;
    var node = renderTextInput(stub);

    node.value = 'giraffe';
    ReactTestUtils.Simulate.input(node);
    expect(node.value).toBe('0');
  });

  it('should not set a value for submit buttons unnecessarily', function() {
    var stub = <input type="submit" />;
    var node = renderTextInput(stub);

    // The value shouldn't be '', or else the button will have no text; it
    // should have the default "Submit" or "Submit Query" label
    expect(node.hasAttribute('value')).toBe(false);
  });

  it('should control radio buttons', function() {
    var RadioGroup = React.createClass({
      render: function() {
        return (
          <div>
            <input ref="a" type="radio" name="fruit" checked={true} />A
            <input ref="b" type="radio" name="fruit" />B

            <form>
              <input ref="c" type="radio" name="fruit" defaultChecked={true} />
            </form>
          </div>
        );
      }
    });

    var stub = ReactTestUtils.renderIntoDocument(<RadioGroup />);
    var aNode = stub.refs.a.getDOMNode();
    var bNode = stub.refs.b.getDOMNode();
    var cNode = stub.refs.c.getDOMNode();

    expect(aNode.checked).toBe(true);
    expect(bNode.checked).toBe(false);
    // c is in a separate form and shouldn't be affected at all here
    expect(cNode.checked).toBe(true);

    bNode.checked = true;
    // This next line isn't necessary in a proper browser environment, but
    // jsdom doesn't uncheck the others in a group (which makes this whole test
    // a little less effective)
    aNode.checked = false;
    expect(cNode.checked).toBe(true);

    // Now let's run the actual ReactDOMInput change event handler (on radio
    // inputs, ChangeEventPlugin listens for the `click` event so trigger that)
    ReactTestUtils.Simulate.click(bNode);

    // The original state should have been restored
    expect(aNode.checked).toBe(true);
    expect(cNode.checked).toBe(true);
  });

  it('should support ReactLink', function() {
    var container = document.createElement('div');
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <input type="text" valueLink={link} />;

    React.renderComponent(instance, container);

    expect(instance.getDOMNode().value).toBe('yolo');
    expect(link.value).toBe('yolo');
    expect(link.requestChange.mock.calls.length).toBe(0);

    instance.getDOMNode().value = 'test';
    ReactTestUtils.Simulate.input(instance.getDOMNode());

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('test');
  });

  it('should throw if both value and valueLink are provided', function() {
    var node = document.createElement('div');
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <input type="text" valueLink={link} />;

    expect(React.renderComponent.bind(React, instance, node)).not.toThrow();

    instance = <input type="text" valueLink={link} value="test" />;
    expect(React.renderComponent.bind(React, instance, node)).toThrow();

    instance = <input type="text" valueLink={link} onChange={emptyFunction} />;
    expect(React.renderComponent.bind(React, instance, node)).toThrow();

  });
});
