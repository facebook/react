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

var mocks = require('mocks');

describe('ReactDOMSelect', function() {
  var React;
  var ReactLink;
  var ReactTestUtils;

  var renderSelect;

  beforeEach(function() {
    React = require('React');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');

    renderSelect = function(component) {
      var stub = ReactTestUtils.renderIntoDocument(component);
      var node = stub.getDOMNode();
      return node;
    };
  });

  it('should allow setting `defaultValue`', function() {
    var stub =
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    var node = renderSelect(stub);

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    stub.setProps({defaultValue: 'gorilla'});
    expect(node.value).toEqual('giraffe');
  });

  it('should allow setting `defaultValue` with multiple', function() {
    var stub =
      <select multiple={true} defaultValue={['giraffe', 'gorilla']}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>;
    var node = renderSelect(stub);

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
    var node = renderSelect(stub);

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
    var node = renderSelect(stub);

    expect(node.options[0].selected).toBe(false);  // monkey
    expect(node.options[1].selected).toBe(true);  // giraffe
    expect(node.options[2].selected).toBe(true);  // gorilla

    // Changing the `value` prop should change the selected options.
    stub.setProps({value: ['monkey']});

    expect(node.options[0].selected).toBe(true);  // monkey
    expect(node.options[1].selected).toBe(false);  // giraffe
    expect(node.options[2].selected).toBe(false);  // gorilla
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
    var node = renderSelect(stub);

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
    var node = renderSelect(stub);

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
    var node = renderSelect(stub);

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
    var node = renderSelect(stub);

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
