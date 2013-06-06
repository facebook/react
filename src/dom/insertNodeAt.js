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
 * @providesModule insertNodeAt
 */

"use strict";

/**
 * Inserts `node` at a particular child index. Other nodes move to make room.
 * @param {!Element} root The parent root node to insert into.
 * @param {!node} node The node to insert.
 * @param {!number} atIndex The index in `root` that `node` should exist at.
 */
function insertNodeAt(root, node, atIndex) {
  var childNodes = root.childNodes;
  // Remove from parent so that if node is already child of root,
  // `childNodes[atIndex]` already takes into account the removal.
  var curAtIndex = root.childNodes[atIndex];
  if (curAtIndex === node) {
    return node;
  }
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
  if (atIndex >= childNodes.length) {
    root.appendChild(node);
  } else {
    root.insertBefore(node, childNodes[atIndex]);
  }
  return node;
}

module.exports = insertNodeAt;
