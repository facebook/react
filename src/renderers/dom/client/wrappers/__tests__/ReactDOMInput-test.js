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

describe('ReactDOMInput', function() {
  var React;
  var ReactLink;
  var ReactTestUtils;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');
    spyOn(console, 'error');
  });

  it('should display `defaultValue` of number 0', function() {
    var stub = <input type="text" defaultValue={0} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('0');
  });

  it('should display "true" for `defaultValue` of `true`', function() {
    var stub = <input type="text" defaultValue={true} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('true');
  });

  it('should display "false" for `defaultValue` of `false`', function() {
    var stub = <input type="text" defaultValue={false} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', function() {
    var objToString = {
      toString: function() {
        return 'foobar';
      },
    };

    var stub = <input type="text" defaultValue={objToString} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('foobar');
  });

  it('should display `value` of number 0', function() {
    var stub = <input type="text" value={0} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('0');
  });

  it('should allow setting `value` to `true`', function() {
    var container = document.createElement('div');
    var stub = <input type="text" value="yolo" onChange={emptyFunction} />;
    stub = React.render(stub, container);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('yolo');

    stub = React.render(
      <input type="text" value={true} onChange={emptyFunction} />,
      container
    );
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', function() {
    var container = document.createElement('div');
    var stub = <input type="text" value="yolo" onChange={emptyFunction} />;
    stub = React.render(stub, container);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('yolo');

    stub = React.render(
      <input type="text" value={false} onChange={emptyFunction} />,
      container
    );
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', function() {
    var container = document.createElement('div');
    var stub = <input type="text" value="foo" onChange={emptyFunction} />;
    stub = React.render(stub, container);
    var node = React.findDOMNode(stub);

    expect(node.value).toBe('foo');

    var objToString = {
      toString: function() {
        return 'foobar';
      },
    };
    stub = React.render(
      <input type="text" value={objToString} onChange={emptyFunction} />,
      container
    );
    expect(node.value).toEqual('foobar');
  });

  it('should properly control a value of number `0`', function() {
    var stub = <input type="text" value={0} onChange={emptyFunction} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);
    expect(node.value).toBe('0');
  });

  it('should not set a value for submit buttons unnecessarily', function() {
    var stub = <input type="submit" />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    // The value shouldn't be '', or else the button will have no text; it
    // should have the default "Submit" or "Submit Query" label. Most browsers
    // report this as not having a `value` attribute at all; IE reports it as
    // the actual label that the user sees.
    expect(
      !node.hasAttribute('value') || node.getAttribute('value').length > 0
    ).toBe(true);
  });

  it('should control radio buttons', function() {
    var RadioGroup = React.createClass({
      render: function() {
        return (
          <div>
            <input
              ref="a"
              type="radio"
              name="fruit"
              checked={true}
              onChange={emptyFunction}
            />A
            <input
              ref="b"
              type="radio"
              name="fruit"
              onChange={emptyFunction}
            />B

            <form>
              <input
                ref="c"
                type="radio"
                name="fruit"
                defaultChecked={true}
                onChange={emptyFunction}
              />
            </form>
          </div>
        );
      },
    });

    var stub = ReactTestUtils.renderIntoDocument(<RadioGroup />);
    var aNode = React.findDOMNode(stub.refs.a);
    var bNode = React.findDOMNode(stub.refs.b);
    var cNode = React.findDOMNode(stub.refs.c);

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
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <input type="text" valueLink={link} />;

    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(React.findDOMNode(instance).value).toBe('yolo');
    expect(link.value).toBe('yolo');
    expect(link.requestChange.mock.calls.length).toBe(0);

    React.findDOMNode(instance).value = 'test';
    ReactTestUtils.Simulate.change(React.findDOMNode(instance));

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('test');
  });

  it('should warn with value and no onChange handler', function() {
    var link = new ReactLink('yolo', mocks.getMockFunction());
    ReactTestUtils.renderIntoDocument(<input type="text" valueLink={link} />);
    expect(console.error.argsForCall.length).toBe(0);

    ReactTestUtils.renderIntoDocument(
      <input type="text" value="zoink" onChange={mocks.getMockFunction()} />
    );
    expect(console.error.argsForCall.length).toBe(0);
    ReactTestUtils.renderIntoDocument(<input type="text" value="zoink" />);
    expect(console.error.argsForCall.length).toBe(1);
  });

  it('should warn with value and no onChange handler and readOnly specified', function() {
    ReactTestUtils.renderIntoDocument(
      <input type="text" value="zoink" readOnly={true} />
    );
    expect(console.error.argsForCall.length).toBe(0);

    ReactTestUtils.renderIntoDocument(
      <input type="text" value="zoink" readOnly={false} />
    );
    expect(console.error.argsForCall.length).toBe(1);
  });

  it('should throw if both value and valueLink are provided', function() {
    var node = document.createElement('div');
    var link = new ReactLink('yolo', mocks.getMockFunction());
    var instance = <input type="text" valueLink={link} />;

    expect(React.render.bind(React, instance, node)).not.toThrow();

    instance =
      <input
        type="text"
        valueLink={link}
        value="test"
        onChange={emptyFunction}
      />;
    expect(React.render.bind(React, instance, node)).toThrow();

    instance = <input type="text" valueLink={link} onChange={emptyFunction} />;
    expect(React.render.bind(React, instance, node)).toThrow();

  });

  it('should support checkedLink', function() {
    var link = new ReactLink(true, mocks.getMockFunction());
    var instance = <input type="checkbox" checkedLink={link} />;

    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(React.findDOMNode(instance).checked).toBe(true);
    expect(link.value).toBe(true);
    expect(link.requestChange.mock.calls.length).toBe(0);

    React.findDOMNode(instance).checked = false;
    ReactTestUtils.Simulate.change(React.findDOMNode(instance));

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual(false);
  });

  it('should warn with checked and no onChange handler', function() {
    var node = document.createElement('div');
    var link = new ReactLink(true, mocks.getMockFunction());
    React.render(<input type="checkbox" checkedLink={link} />, node);
    expect(console.error.argsForCall.length).toBe(0);

    ReactTestUtils.renderIntoDocument(
      <input
        type="checkbox"
        checked="false"
        onChange={mocks.getMockFunction()}
      />
    );
    expect(console.error.argsForCall.length).toBe(0);

    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" readOnly={true} />
    );
    expect(console.error.argsForCall.length).toBe(0);

    ReactTestUtils.renderIntoDocument(<input type="checkbox" checked="false" />);
    expect(console.error.argsForCall.length).toBe(1);
  });

  it('should warn with checked and no onChange handler with readOnly specified', function() {
    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" readOnly={true} />
    );
    expect(console.error.argsForCall.length).toBe(0);

    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" readOnly={false} />
    );
    expect(console.error.argsForCall.length).toBe(1);
  });

  it('should throw if both checked and checkedLink are provided', function() {
    var node = document.createElement('div');
    var link = new ReactLink(true, mocks.getMockFunction());
    var instance = <input type="checkbox" checkedLink={link} />;

    expect(React.render.bind(React, instance, node)).not.toThrow();

    instance =
      <input
        type="checkbox"
        checkedLink={link}
        checked="false"
        onChange={emptyFunction}
      />;
    expect(React.render.bind(React, instance, node)).toThrow();

    instance =
      <input type="checkbox" checkedLink={link} onChange={emptyFunction} />;
    expect(React.render.bind(React, instance, node)).toThrow();

  });

  it('should throw if both checkedLink and valueLink are provided', function() {
    var node = document.createElement('div');
    var link = new ReactLink(true, mocks.getMockFunction());
    var instance = <input type="checkbox" checkedLink={link} />;

    expect(React.render.bind(React, instance, node)).not.toThrow();

    instance = <input type="checkbox" valueLink={link} />;
    expect(React.render.bind(React, instance, node)).not.toThrow();

    instance =
      <input type="checkbox" checkedLink={link} valueLink={emptyFunction} />;
    expect(React.render.bind(React, instance, node)).toThrow();
  });
});
