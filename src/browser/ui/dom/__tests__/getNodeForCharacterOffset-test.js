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

/*jslint evil: true */

'use strict';

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
