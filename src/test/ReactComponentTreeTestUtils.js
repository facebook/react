/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponentTreeTestUtils
 */

'use strict';

var ReactComponentTreeDevtool = require('ReactComponentTreeDevtool');

function getRootDisplayNames() {
  return ReactComponentTreeDevtool.getRootIDs()
    .map(ReactComponentTreeDevtool.getDisplayName);
}

function getRegisteredDisplayNames() {
  return ReactComponentTreeDevtool.getRegisteredIDs()
    .map(ReactComponentTreeDevtool.getDisplayName);
}

function expectTree(rootID, expectedTree, parentPath = '') {
  var displayName = ReactComponentTreeDevtool.getDisplayName(rootID);
  var ownerID = ReactComponentTreeDevtool.getOwnerID(rootID);
  var parentID = ReactComponentTreeDevtool.getParentID(rootID);
  var childIDs = ReactComponentTreeDevtool.getChildIDs(rootID);
  var text = ReactComponentTreeDevtool.getText(rootID);
  var path = parentPath ? `${parentPath} > ${displayName}` : displayName;

  function expectEqual(actual, expected, name) {
    // Get Jasmine to print descriptive error messages.
    // We pass path so that we know where the mismatch occurred.
    expect({
      path,
      [name]: actual,
    }).toEqual({
      path,
      [name]: expected,
    });
  }

  if (expectedTree.parentDisplayName !== undefined) {
    expectEqual(
      ReactComponentTreeDevtool.getDisplayName(parentID),
      expectedTree.parentDisplayName,
      'parentDisplayName'
    );
  }
  if (expectedTree.ownerDisplayName !== undefined) {
    expectEqual(
      ReactComponentTreeDevtool.getDisplayName(ownerID),
      expectedTree.ownerDisplayName,
      'ownerDisplayName'
    );
  }
  if (expectedTree.parentID !== undefined) {
    expectEqual(parentID, expectedTree.parentID, 'parentID');
  }
  if (expectedTree.text !== undefined) {
    expectEqual(text, expectedTree.text, 'text');
  } else {
    expectEqual(text, null, 'text');
  }
  if (expectedTree.children !== undefined) {
    expectEqual(
      childIDs.length,
      expectedTree.children.length,
      'children.length'
    );
    for (var i = 0; i < childIDs.length; i++) {
      expectTree(
        childIDs[i],
        {parentID: rootID, ...expectedTree.children[i]},
        path
      );
    }
  } else {
    expectEqual(childIDs, [], 'childIDs');
  }
}

var ReactComponentTreeTestUtils = {
  expectTree,
  getRootDisplayNames,
  getRegisteredDisplayNames,
};

module.exports = ReactComponentTreeTestUtils;
