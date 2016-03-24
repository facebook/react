/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeDOMIDOperations
 * @flow
 */
'use strict';

var ReactNativeTagHandles = require('ReactNativeTagHandles');
var ReactMultiChildUpdateTypes = require('ReactMultiChildUpdateTypes');
var ReactPerf = require('ReactPerf');
var UIManager = require('UIManager');

/**
 * Updates a component's children by processing a series of updates.
 * For each of the update/create commands, the `fromIndex` refers to the index
 * that the item existed at *before* any of the updates are applied, and the
 * `toIndex` refers to the index after *all* of the updates are applied
 * (including deletes/moves). TODO: refactor so this can be shared with
 * DOMChildrenOperations.
 *
 * @param {array<object>} updates List of update configurations.
 * @param {array<string>} markup List of markup strings - in the case of React
 * IOS, the ids of new components assumed to be already created.
 */
var dangerouslyProcessChildrenUpdates = function(childrenUpdates, markupList) {
  if (!childrenUpdates.length) {
    return;
  }
  var byContainerTag = {};
  // Group by parent ID - send them across the bridge in separate commands per
  // containerID.
  for (var i = 0; i < childrenUpdates.length; i++) {
    var update = childrenUpdates[i];
    var containerTag = ReactNativeTagHandles.mostRecentMountedNodeHandleForRootNodeID(update.parentID);
    var updates = byContainerTag[containerTag] || (byContainerTag[containerTag] = {});
    if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING) {
      (updates.moveFromIndices || (updates.moveFromIndices = [])).push(update.fromIndex);
      (updates.moveToIndices || (updates.moveToIndices = [])).push(update.toIndex);
    } else if (update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
      (updates.removeAtIndices || (updates.removeAtIndices = [])).push(update.fromIndex);
    } else if (update.type === ReactMultiChildUpdateTypes.INSERT_MARKUP) {
      var mountImage = markupList[update.markupIndex];
      var tag = mountImage.tag;
      var rootNodeID = mountImage.rootNodeID;
      ReactNativeTagHandles.associateRootNodeIDWithMountedNodeHandle(rootNodeID, tag);
      (updates.addAtIndices || (updates.addAtIndices = [])).push(update.toIndex);
      (updates.addChildTags || (updates.addChildTags = [])).push(tag);
    }
  }
  // Note this enumeration order will be different on V8!  Move `byContainerTag`
  // to a sparse array as soon as we confirm there are not horrible perf
  // penalties.
  for (var updateParentTagString in byContainerTag) {
    var updateParentTagNumber = +updateParentTagString;
    var childUpdatesToSend = byContainerTag[updateParentTagNumber];
    UIManager.manageChildren(
      updateParentTagNumber,
      childUpdatesToSend.moveFromIndices,
      childUpdatesToSend.moveToIndices,
      childUpdatesToSend.addChildTags,
      childUpdatesToSend.addAtIndices,
      childUpdatesToSend.removeAtIndices
    );
  }
};

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactComponent.DOMIDOperations`.
 */
var ReactNativeDOMIDOperations = {
  dangerouslyProcessChildrenUpdates: ReactPerf.measure(
    // FIXME(frantic): #4441289 Hack to avoid modifying react-tools
    'ReactDOMIDOperations',
    'dangerouslyProcessChildrenUpdates',
    dangerouslyProcessChildrenUpdates
  ),

  /**
   * Replaces a view that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Mount image to replace child with id.
   */
  dangerouslyReplaceNodeWithMarkupByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'dangerouslyReplaceNodeWithMarkupByID',
    function(id, mountImage) {
      var oldTag = ReactNativeTagHandles.mostRecentMountedNodeHandleForRootNodeID(id);
      UIManager.replaceExistingNonRootView(oldTag, mountImage.tag);
      ReactNativeTagHandles.associateRootNodeIDWithMountedNodeHandle(id, mountImage.tag);
    }
  ),
};

module.exports = ReactNativeDOMIDOperations;
