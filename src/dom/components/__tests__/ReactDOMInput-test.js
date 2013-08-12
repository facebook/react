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

describe('ReactDOMInput', function() {
  var React;
  var ReactTestUtils;

  var renderTextInput;

  beforeEach(function() {
    React = require('React');
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

  it('should display `value` of number 0', function() {
    var stub = <input type="text" value={0} />;
    var node = renderTextInput(stub);

    expect(node.value).toBe('0');
  });

});
