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

var emptyFunction = require('emptyFunction');
var mocks = require('mocks');

describe('ReactDOMInput', function() {
  var React;
  var ReactLink;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should display `defaultValue` of number 0', function() {
    var stub = <input type="text" defaultValue={0} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('0');
  });

  it('should display "true" for `defaultValue` of `true`', function() {
    var stub = <input type="text" defaultValue={true} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('true');
  });

  it('should display "false" for `defaultValue` of `false`', function() {
    var stub = <input type="text" defaultValue={false} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', function() {
    var objToString = {
      toString: function() {
        return "foobar";
      }
    };

    var stub = <input type="text" defaultValue={objToString} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('foobar');
  });

  it('should display `value` of number 0', function() {
    var stub = <input type="text" value={0} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('0');
  });

  it('should allow setting `value` to `true`', function() {
    var stub = <input type="text" value="yolo" />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('yolo');

    stub.replaceProps({value: true});
    expect(node.value).toEqual('true');
  });

  it("should allow setting `value` to `false`", function() {
    var stub = <input type="text" value="yolo" />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('yolo');

    stub.replaceProps({value: false});
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', function() {
    var stub = <input type="text" value="foo" />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

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
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);
    expect(node.value).toBe('0');
  });

  it('should not set a value for submit buttons unnecessarily', function() {
    var stub = <input type="submit" />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    // The value shouldn't be '', or else the button will have no text; it
    // should have the default "Submit" or "Submit Query" label
    expect(node.hasAttribute('value')).toBe(false);
  });

  it('should control radio buttons', function() {
    var RadioGroup = React.createClass({
      render: function() {
        return (
          <div>
            <input ref="a" type="radio" name="fruit" checked={true} />A{' '}
            <input ref="b" type="radio" name="fruit" />B{' '}

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

    // Now let's run the actual ReactDOMInput change event handler
    ReactTestUtils.Simulate.change(bNode);

    // The original state should have been restored
    expect(aNode.checked).toBe(true);
    expect(cNode.checked).toBe(true);
  });

  it('should support ReactLink', function() {
    var container = document.createElement('div');
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <input type="text" valueLink={link} />;

    instance = React.renderComponent(instance, container);

    expect(instance.getDOMNode().value).toBe('yolo');
    expect(link.value).toBe('yolo');
    expect(link.requestChange.mock.calls.length).toBe(0);

    instance.getDOMNode().value = 'test';
    ReactTestUtils.Simulate.change(instance.getDOMNode());

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('test');
  });

  it('should warn with value and no onChange handler', function() {
    var oldWarn = console.warn;
    try {
      console.warn = mocks.getMockFunction();

      var node = document.createElement('div');
      var link = new ReactLink('yolo', mocks.getMockFunction());
      React.renderComponent(<input type="text" valueLink={link} />, node);
      expect(console.warn.mock.calls.length).toBe(0);

      React.renderComponent(
        <input type="text" value="zoink" onChange={mocks.getMockFunction()} />,
        node
      );
      expect(console.warn.mock.calls.length).toBe(0);

      React.renderComponent(
        <input type="text" value="zoink" readOnly={true} />,
        node
      );
      expect(console.warn.mock.calls.length).toBe(0);

      React.renderComponent(<input type="text" value="zoink" />, node);
      expect(console.warn.mock.calls.length).toBe(1);

      React.renderComponent(
        <input type="text" value="zoink" readOnly={false} />,
        node
      );
      expect(console.warn.mock.calls.length).toBe(2);
    } finally {
      console.warn = oldWarn;
    }
  });

  it('should throw if both value and valueLink are provided', function() {
    // Silences console.error messages
    // ReactErrorUtils.guard is applied to all methods of a React component
    // and calls console.error in __DEV__ (true for test environment)
    spyOn(console, 'error');

    var node = document.createElement('div');
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <input type="text" valueLink={link} />;

    expect(React.renderComponent.bind(React, instance, node)).not.toThrow();

    instance = <input type="text" valueLink={link} value="test" />;
    expect(React.renderComponent.bind(React, instance, node)).toThrow();

    instance = <input type="text" valueLink={link} onChange={emptyFunction} />;
    expect(React.renderComponent.bind(React, instance, node)).toThrow();

  });

  it('should support checkedLink', function() {
    var container = document.createElement('div');
    var link = new ReactLink(true, mocks.getMockFunction());
    var instance = <input type="checkbox" checkedLink={link} />;

    instance = React.renderComponent(instance, container);

    expect(instance.getDOMNode().checked).toBe(true);
    expect(link.value).toBe(true);
    expect(link.requestChange.mock.calls.length).toBe(0);

    instance.getDOMNode().checked = false;
    ReactTestUtils.Simulate.change(instance.getDOMNode());

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual(false);
  });

  it('should warn with checked and no onChange handler', function() {
    var oldWarn = console.warn;
    try {
      console.warn = mocks.getMockFunction();

      var node = document.createElement('div');
      var link = new ReactLink(true, mocks.getMockFunction());
      React.renderComponent(<input type="checkbox" checkedLink={link} />, node);
      expect(console.warn.mock.calls.length).toBe(0);

      React.renderComponent(
        <input type="checkbox" checked="false" onChange={mocks.getMockFunction()} />,
        node
      );
      expect(console.warn.mock.calls.length).toBe(0);

      React.renderComponent(
        <input type="checkbox" checked="false" readOnly={true} />,
        node
      );
      expect(console.warn.mock.calls.length).toBe(0);

      React.renderComponent(<input type="checkbox" checked="false" />, node);
      expect(console.warn.mock.calls.length).toBe(1);

      React.renderComponent(
        <input type="checkbox" checked="false" readOnly={false} />,
        node
      );
      expect(console.warn.mock.calls.length).toBe(2);
    } finally {
      console.warn = oldWarn;
    }
  });

  it('should throw if both checked and checkedLink are provided', function() {
    // Silences console.error messages
    // ReactErrorUtils.guard is applied to all methods of a React component
    // and calls console.error in __DEV__ (true for test environment)
    spyOn(console, 'error');

    var node = document.createElement('div');
    var link = new ReactLink(true, mocks.getMockFunction());
    var instance = <input type="checkbox" checkedLink={link} />;

    expect(React.renderComponent.bind(React, instance, node)).not.toThrow();

    instance = <input type="checkbox" checkedLink={link} checked="false" />;
    expect(React.renderComponent.bind(React, instance, node)).toThrow();

    instance = <input type="checkbox" checkedLink={link} onChange={emptyFunction} />;
    expect(React.renderComponent.bind(React, instance, node)).toThrow();

  });

  it('should throw if both checkedLink and valueLink are provided', function() {
    // Silences console.error messages
    // ReactErrorUtils.guard is applied to all methods of a React component
    // and calls console.error in __DEV__ (true for test environment)
    spyOn(console, 'error');

    var node = document.createElement('div');
    var link = new ReactLink(true, mocks.getMockFunction());
    var instance = <input type="checkbox" checkedLink={link} />;

    expect(React.renderComponent.bind(React, instance, node)).not.toThrow();

    instance = <input type="checkbox" valueLink={link} />;
    expect(React.renderComponent.bind(React, instance, node)).not.toThrow();

    instance = <input type="checkbox" checkedLink={link} valueLink={emptyFunction} />;
    expect(React.renderComponent.bind(React, instance, node)).toThrow();
  });
});
