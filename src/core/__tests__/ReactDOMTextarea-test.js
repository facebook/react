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

describe('ReactDOMTextarea', function() {
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it("should update value", function() {
    var stub = ReactTestUtils.renderIntoDocument(<textarea>giraffe</textarea>);
    var node = stub.getDOMNode();

    expect(node.value).toEqual('giraffe');

    stub.replaceProps({ children: 'gorilla' });
    expect(node.value).toEqual('gorilla');

    stub.replaceProps({ children: 17 });
    expect(node.value).toEqual('17');

    stub.replaceProps({ children: [42] });
    expect(node.value).toEqual('42');

    stub.replaceProps({ children: null });
    expect(node.value).toEqual('');

    stub.replaceProps({ content: 'eggplant' });
    expect(node.value).toEqual('eggplant');
  });

  it("should throw with multiple or invalid children", function() {
    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <textarea>{'hello'}{'there'}</textarea>
      );
    }).toThrow();

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <textarea><strong /></textarea>
      );
    }).toThrow();
  });
});
