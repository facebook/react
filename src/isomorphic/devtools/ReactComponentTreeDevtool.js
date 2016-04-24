/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponentTreeDevtool
 */

'use strict';

var invariant = require('invariant');

var unmountedContainerIDs = [];
var tree = {};

function updateTree(id, update) {
  if (!tree[id]) {
    tree[id] = {
      nativeContainerID: null,
      parentID: null,
      ownerID: null,
      text: null,
      childIDs: [],
      displayName: 'Unknown',
      isTopLevelWrapper: false,
    };
  }
  update(tree[id]);
}

function purgeTree(id) {
  var item = tree[id];
  if (item) {
    var {childIDs} = item;
    delete tree[id];
    childIDs.forEach(purgeTree);
  }
}

var ReactComponentTreeDevtool = {
  onSetIsTopLevelWrapper(id, isTopLevelWrapper) {
    updateTree(id, item => item.isTopLevelWrapper = isTopLevelWrapper);
  },

  onSetIsComposite(id, isComposite) {
    updateTree(id, item => item.isComposite = isComposite);
  },

  onSetDisplayName(id, displayName) {
    updateTree(id, item => item.displayName = displayName);
  },

  onSetChildren(id, nextChildIDs) {
    if (ReactComponentTreeDevtool.isTopLevelWrapper(id)) {
      return;
    }

    updateTree(id, item => {
      var prevChildIDs = item.childIDs;
      item.childIDs = nextChildIDs;

      prevChildIDs.forEach(prevChildID => {
        var prevChild = tree[prevChildID];
        if (prevChild && nextChildIDs.indexOf(prevChildID) === -1) {
          prevChild.parentID = null;
        }
      });

      nextChildIDs.forEach(nextChildID => {
        var nextChild = tree[nextChildID];
        invariant(
          nextChild,
          'Expected devtool events to fire for the child ' +
          'before its parent includes it in onSetChildren().'
        );
        invariant(
          nextChild.isComposite != null,
          'Expected onSetIsComposite() to fire for the child ' +
          'before its parent includes it in onSetChildren().'
        );
        invariant(
          nextChild.displayName != null,
          'Expected onSetDisplayName() to fire for the child ' +
          'before its parent includes it in onSetChildren().'
        );
        invariant(
          nextChild.childIDs != null || nextChild.text != null,
          'Expected either onSetChildren() or onSetText() to fire for the child ' +
          'before its parent includes it in onSetChildren().'
        );

        if (prevChildIDs.indexOf(nextChildID) === -1) {
          nextChild.parentID = id;
        }
      });
    });
  },

  onSetOwner(id, ownerID) {
    updateTree(id, item => item.ownerID = ownerID);
  },

  onSetText(id, text) {
    updateTree(id, item => item.text = text);
  },

  onMountComponent(id, nativeContainerID) {
    updateTree(id, item => item.nativeContainerID = nativeContainerID);
  },

  onUnmountComponent(id) {
    purgeTree(id);
  },

  onUnmountNativeContainer(nativeContainerID) {
    unmountedContainerIDs.push(nativeContainerID);
  },

  purgeUnmountedComponents() {
    var unmountedIDs = Object.keys(tree).filter(id =>
      unmountedContainerIDs.indexOf(tree[id].nativeContainerID) !== -1
    );
    unmountedContainerIDs = [];
    unmountedIDs.forEach(purgeTree);
  },

  isComposite(id) {
    var item = tree[id];
    return item ? item.isComposite : false;
  },

  isTopLevelWrapper(id) {
    var item = tree[id];
    return item ? item.isTopLevelWrapper : false;
  },

  getChildIDs(id) {
    var item = tree[id];
    return item ? item.childIDs : [];
  },

  getDisplayName(id) {
    var item = tree[id];
    return item ? item.displayName : 'Unknown';
  },

  getOwnerID(id) {
    var item = tree[id];
    return item ? item.ownerID : null;
  },

  getParentID(id) {
    var item = tree[id];
    return item ? item.parentID : null;
  },

  getText(id) {
    var item = tree[id];
    return item ? item.text : null;
  },

  getRegisteredIDs() {
    return Object.keys(tree);
  },
};

module.exports = ReactComponentTreeDevtool;
