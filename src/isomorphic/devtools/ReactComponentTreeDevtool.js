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

var isTopLevelWrapperByID = {};
var unmountedContainerIDs = [];
var allChildIDsByContainerID = {};
var tree = {};

function updateTree(id, update) {
  if (isTopLevelWrapperByID[id]) {
    return;
  }
  if (!tree[id]) {
    tree[id] = {
      parentID: null,
      childIDs: [],
    };
  }
  update(tree[id]);
}

function purgeTree(id) {
  var item = tree[id];
  if (!item) {
    return;
  }

  var {childIDs, containerID} = item;
  delete tree[id];

  if (containerID) {
    allChildIDsByContainerID[containerID] = allChildIDsByContainerID[containerID]
      .filter(childID => childID !== id);
  }
  childIDs.forEach(purgeTree);
}

var ReactComponentTreeDevtool = {
  onSetIsTopLevelWrapper(id, isTopLevelWrapper) {
    if (isTopLevelWrapper) {
      delete tree[id];
      isTopLevelWrapperByID[id] = true;
    }
  },

  onSetIsComposite(id, isComposite) {
    updateTree(id, item => item.isComposite = isComposite);
  },

  onSetDisplayName(id, displayName) {
    updateTree(id, item => item.displayName = displayName);
  },

  onSetChildren(id, nextChildIDs) {
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

  onMountComponent(id, containerID) {
    if (!allChildIDsByContainerID[containerID]) {
      allChildIDsByContainerID[containerID] = [];
    }
    allChildIDsByContainerID[containerID].push(id);
    updateTree(id, item => item.containerID = containerID);
  },

  onUnmountComponent(id) {
    purgeTree(id);
  },

  onUnmountNativeContainer(containerID) {
    unmountedContainerIDs.push(containerID);
  },

  purgeUnmountedContainers() {
    unmountedContainerIDs.forEach(containerID => {
      allChildIDsByContainerID[containerID].forEach(purgeTree);
    });
    unmountedContainerIDs = [];
  },

  isComposite(id) {
    return tree[id].isComposite;
  },

  getChildIDs(id) {
    return tree[id].childIDs;
  },

  getDisplayName(id) {
    return tree[id].displayName;
  },

  getOwnerID(id) {
    return tree[id].ownerID;
  },

  getParentID(id) {
    return tree[id].parentID;
  },

  getText(id) {
    return tree[id].text;
  },

  getRegisteredIDs() {
    return Object.keys(tree);
  },
};

module.exports = ReactComponentTreeDevtool;
