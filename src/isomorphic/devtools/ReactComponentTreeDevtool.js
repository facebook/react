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
var allChildIDsByContainerID = {};
var tree = {};

function updateTree(id, update) {
  if (!tree[id]) {
    tree[id] = {};
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

  if (childIDs) {
    childIDs.forEach(purgeTree);
  }
}

var ReactComponentTreeDevtool = {
  onSetIsComposite(id, isComposite) {
    updateTree(id, item => item.isComposite = isComposite);
  },

  onSetDisplayName(id, displayName) {
    updateTree(id, item => item.displayName = displayName);
  },

  onSetChildren(id, nextChildIDs) {
    var prevChildIDs;
    updateTree(id, item => {
      prevChildIDs = item.childIDs || [];
      item.childIDs = nextChildIDs;
    });

    prevChildIDs.forEach(prevChildID => {
      if (tree[prevChildID] && nextChildIDs.indexOf(prevChildID) === -1) {
        tree[prevChildID].parentID = null;
      }
    });

    nextChildIDs.forEach(nextChildID => {
      var item = tree[nextChildID];

      invariant(
        item,
        'Expected devtool events to fire for the child ' +
        'before its parent includes it in onSetChildren().'
      );
      invariant(
        item.isComposite != null,
        'Expected onSetIsComposite() to fire for the child ' +
        'before its parent includes it in onSetChildren().'
      );
      invariant(
        item.displayName != null,
        'Expected onSetDisplayName() to fire for the child ' +
        'before its parent includes it in onSetChildren().'
      );
      invariant(
        item.childIDs != null || item.text != null,
        'Expected either onSetChildren() or onSetText() to fire for the child ' +
        'before its parent includes it in onSetChildren().'
      );

      if (tree[nextChildID] && prevChildIDs.indexOf(nextChildID) === -1) {
        tree[nextChildID].parentID = id;
      }
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

  getTree() {
    return Object.keys(tree).reduce((result, key) => {
      result[key] = {...tree[key]};
      return result;
    }, {});
  },
};

module.exports = ReactComponentTreeDevtool;
