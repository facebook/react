/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

/*jshint evil:true */

var mocks = require('mocks');

describe('ReactDOMSelect', function() {
  var React;
  var ReactLink;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should allow setting `defaultValue`', function() {
    var stub =
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    stub.setProps({defaultValue: 'gorilla'});
    expect(node.value).toEqual('giraffe');
  });

  it('should not control when using `defaultValue`', function() {
    var stub =
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    node.value = 'monkey';
    stub.forceUpdate();
    // Uncontrolled selects shouldn't change the value after first mounting
    expect(node.value).toEqual('monkey');
  });

  it('should allow setting `defaultValue` with multiple', function() {
    var stub =
      <select multiple={true} defaultValue={['giraffe', 'gorilla']}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(true);  // gorilla

    // Changing `defaultValue` should do nothing.
    stub.setProps({defaultValue: ['monkey']});

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(true);  // gorilla
  });

  it('should allow setting `value`', function() {
    var stub =
      <select value="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.value).toBe('giraffe');

    // Changing the `value` prop should change the selected option.
    stub.setProps({value: 'gorilla'});
    expect(node.value).toEqual('gorilla');
  });

  it('should allow setting `value` with multiple', function() {
    var stub =
      <select multiple={true} value={['giraffe', 'gorilla']}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(true);  // gorilla

    // Changing the `value` prop should change the selected options.
    stub.setProps({value: ['monkey']});

    expect(node.options[0].selected).toBe(true);  // monkey
    expect(node.options[1].selected).toBe(false);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla
  });

  it('should not select other options automatically', function() {
    var stub =
      <select multiple={true} value={['12']}>
        <option value="1">one</option>
        <option value="2">two</option>
        <option value="12">twelve</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.options[0].selected).toBe(false);  // one
    expect(node.options[1].selected).toBe(false);  // two
    expect(node.options[2].selected).toBe(true);  // twelve
  });

  it('should allow setting `value` with `objectToString`', function() {
    var objectToString = {
      animal: "giraffe",
      toString: function() {
        return this.animal;
      }
    };

    var stub =
      <select multiple={true} value={[objectToString]}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla

    // Changing the `value` prop should change the selected options.
    objectToString.animal = "monkey";
    stub.forceUpdate();

    expect(node.options[0].selected).toBe(true);  // monkey
    expect(node.options[1].selected).toBe(false);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla
  });

  it('should allow switching to multiple', function() {
    var stub =
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla

    // When making it multiple, giraffe should still be selected
    stub.setProps({multiple: true, defaultValue: null});

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla
  });

  it('should allow switching from multiple', function() {
    var stub =
      <select multiple={true} defaultValue={['giraffe', 'gorilla']}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(true);  // gorilla

    // When removing multiple, giraffe should still be selected (but gorilla
    // will no longer be)
    stub.setProps({multiple: false, defaultValue: null});

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla
  });

  it('should support ReactLink', function() {
    var link = new ReactLink('giraffe', mocks.getMockFunction());
    var stub =
      <select valueLink={link}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = stub.getDOMNode();

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla
    expect(link.requestChange.mock.calls.length).toBe(0);

    node.options[1].selected = false;
    node.options[2].selected = true;
    ReactTestUtils.Simulate.change(node);

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('gorilla');

  });
});
