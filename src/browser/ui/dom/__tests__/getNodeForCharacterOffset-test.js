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

/*jslint evil: true */

"use strict";

var getTestDocument = require('getTestDocument');

var getNodeForCharacterOffset = require('getNodeForCharacterOffset');

// Create node from HTML string
function createNode(html) {
  var node = (getTestDocument() || document).createElement('div');
  node.innerHTML = html;
  return node;
}

// Check getNodeForCharacterOffset return value matches expected result.
function expectNodeOffset(result, textContent, nodeOffset) {
  expect(result.node.textContent).toBe(textContent);
  expect(result.offset).toBe(nodeOffset);
}

describe('getNodeForCharacterOffset', function() {
  it('should handle siblings', function() {
    var node = createNode('<i>123</i><i>456</i><i>789</i>');

    expectNodeOffset(getNodeForCharacterOffset(node, 0), '123', 0);
    expectNodeOffset(getNodeForCharacterOffset(node, 4), '456', 1);
  });

  it('should handle trailing chars', function() {
    var node = createNode('<i>123</i><i>456</i><i>789</i>');

    expectNodeOffset(getNodeForCharacterOffset(node, 3), '123', 3);
    expectNodeOffset(getNodeForCharacterOffset(node, 9), '789', 3);
  });

  it('should handle trees', function() {
    var node = createNode(
      '<i>' +
        '<i>1</i>' +
        '<i>' +
          '<i>' +
            '<i>2</i>' +
            '<i></i>' +
          '</i>' +
        '</i>' +
        '<i>' +
          '3' +
          '<i>45</i>' +
        '</i>' +
      '</i>'
    );

    expectNodeOffset(getNodeForCharacterOffset(node, 3), '3', 1);
    expectNodeOffset(getNodeForCharacterOffset(node, 5), '45', 2);
    expect(getNodeForCharacterOffset(node, 10)).toBeUndefined();
  });

  it('should handle non-existent offset', function() {
    var node = createNode('<i>123</i>');

    expect(getNodeForCharacterOffset(node, -1)).toBeUndefined();
    expect(getNodeForCharacterOffset(node, 4)).toBeUndefined();
  });
});
