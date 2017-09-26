/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeDOMIDOperations
 */
'use strict';

var ReactNativeComponentTree = require('ReactNativeComponentTree');
var UIManager = require('UIManager');

/**
 * Updates a component's children by processing a series of updates.
 * For each of the update/create commands, the `fromIndex` refers to the index
 * that the item existed at *before* any of the updates are applied, and the
 * `toIndex` refers to the index after *all* of the updates are applied
 * (including deletes/moves). TODO: refactor so this can be shared with
 * DOMChildrenOperations.
 *
 * @param {ReactNativeBaseComponent} updates List of update configurations.
 * @param {array<string>} markup List of markup strings - in the case of React
 * IOS, the ids of new components assumed to be already created.
 */
var dangerouslyProcessChildrenUpdates = function(inst, childrenUpdates) {
  if (!childrenUpdates.length) {
    return;
  }

  var containerTag = ReactNativeComponentTree.getNodeFromInstance(inst);

  var moveFromIndices;
  var moveToIndices;
  var addChildTags;
  var addAtIndices;
  var removeAtIndices;

  for (var i = 0; i < childrenUpdates.length; i++) {
    var update = childrenUpdates[i];
    if (update.type === 'MOVE_EXISTING') {
      (moveFromIndices || (moveFromIndices = [])).push(update.fromIndex);
      (moveToIndices || (moveToIndices = [])).push(update.toIndex);
    } else if (update.type === 'REMOVE_NODE') {
      (removeAtIndices || (removeAtIndices = [])).push(update.fromIndex);
    } else if (update.type === 'INSERT_MARKUP') {
      var mountImage = update.content;
      var tag = mountImage;
      (addAtIndices || (addAtIndices = [])).push(update.toIndex);
      (addChildTags || (addChildTags = [])).push(tag);
    }
  }

  UIManager.manageChildren(
    containerTag,
    moveFromIndices,
    moveToIndices,
    addChildTags,
    addAtIndices,
    removeAtIndices,
  );
};

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactComponent.DOMIDOperations`.
 */
var ReactNativeDOMIDOperations = {
  dangerouslyProcessChildrenUpdates,

  /**
   * Replaces a view that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Mount image to replace child with id.
   */
  dangerouslyReplaceNodeWithMarkupByID: function(id, mountImage) {
    var oldTag = id;
    UIManager.replaceExistingNonRootView(oldTag, mountImage);
  },
};

module.exports = ReactNativeDOMIDOperations;
