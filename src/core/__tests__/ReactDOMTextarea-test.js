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
  var transaction;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it("should remove value with removed children", function() {
    var stub = ReactTestUtils.renderIntoDocument(<textarea>giraffe</textarea>);

    expect(stub.getDOMNode().value).toEqual('giraffe');
    stub.replaceProps({ children: null });
    expect(stub.getDOMNode().value).toEqual('');
  });

  it("should update value with a single string child", function() {
    var stub = ReactTestUtils.renderIntoDocument(<textarea>monkey</textarea>);

    expect(stub.getDOMNode().value).toEqual('monkey');
    stub.replaceProps({ children: 'gorilla' });
    expect(stub.getDOMNode().value).toEqual('gorilla');
  });

  it("should update value with a single numerical child", function() {
    var stub = ReactTestUtils.renderIntoDocument(<textarea>17</textarea>);

    expect(stub.getDOMNode().value).toEqual('17');
    stub.replaceProps({ children: 289 });
    expect(stub.getDOMNode().value).toEqual('289');
  });

  it("should update value with the content property", function() {
    var stub = ReactTestUtils.renderIntoDocument(<textarea content="purple" />);

    expect(stub.getDOMNode().value).toEqual('purple');
    stub.replaceProps({ content: 'eggplant' });
    expect(stub.getDOMNode().value).toEqual('eggplant');
  });
});
