/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponentTreeDevtoolDev
 */

'use strict';

var ReactCurrentOwner = require('ReactCurrentOwner');

var invariant = require('invariant');
var warning = require('warning');

var ReactComponentTreeDevtoolDev = {};

if (__DEV__) {
  var tree = {};
  var unmountedIDs = {};
  var rootIDs = {};

  var updateTree = function(id, update) {
    if (!tree[id]) {
      tree[id] = {
        element: null,
        parentID: null,
        ownerID: null,
        text: null,
        childIDs: [],
        displayName: 'Unknown',
        isMounted: false,
        updateCount: 0,
      };
    }
    update(tree[id]);
  };

  var purgeDeep = function(id) {
    var item = tree[id];
    if (item) {
      var {childIDs} = item;
      delete tree[id];
      childIDs.forEach(purgeDeep);
    }
  };

  var describeComponentFrame = function(name, source, ownerName) {
    return '\n    in ' + name + (
      source ?
        ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' +
        source.lineNumber + ')' :
      ownerName ?
        ' (created by ' + ownerName + ')' :
        ''
    );
  };

  var describeID = function(id) {
    var name = ReactComponentTreeDevtoolDev.getDisplayName(id);
    var element = ReactComponentTreeDevtoolDev.getElement(id);
    var ownerID = ReactComponentTreeDevtoolDev.getOwnerID(id);
    var ownerName;
    if (ownerID) {
      ownerName = ReactComponentTreeDevtoolDev.getDisplayName(ownerID);
    }
    warning(
      element,
      'ReactComponentTreeDevtool: Missing React element for debugID %s when ' +
      'building stack',
      id
    );
    return describeComponentFrame(name, element && element._source, ownerName);
  };

  ReactComponentTreeDevtoolDev = {
    onSetDisplayName(id, displayName) {
      updateTree(id, item => item.displayName = displayName);
    },

    onSetChildren(id, nextChildIDs) {
      updateTree(id, item => {
        item.childIDs = nextChildIDs;

        nextChildIDs.forEach(nextChildID => {
          var nextChild = tree[nextChildID];
          invariant(
            nextChild,
            'Expected devtool events to fire for the child ' +
            'before its parent includes it in onSetChildren().'
          );
          invariant(
            nextChild.displayName != null,
            'Expected onSetDisplayName() to fire for the child ' +
            'before its parent includes it in onSetChildren().'
          );
          invariant(
            nextChild.childIDs != null || nextChild.text != null,
            'Expected onSetChildren() or onSetText() to fire for the child ' +
            'before its parent includes it in onSetChildren().'
          );
          invariant(
            nextChild.isMounted,
            'Expected onMountComponent() to fire for the child ' +
            'before its parent includes it in onSetChildren().'
          );
          if (nextChild.parentID == null) {
            nextChild.parentID = id;
            // TODO: This shouldn't be necessary but mounting a new root during in
            // componentWillMount currently causes not-yet-mounted components to
            // be purged from our tree data so their parent ID is missing.
          }
          invariant(
            nextChild.parentID === id,
            'Expected onSetParent() and onSetChildren() to be consistent (%s ' +
            'has parents %s and %s).',
            nextChildID,
            nextChild.parentID,
            id
          );
        });
      });
    },

    onSetOwner(id, ownerID) {
      updateTree(id, item => item.ownerID = ownerID);
    },

    onSetParent(id, parentID) {
      updateTree(id, item => item.parentID = parentID);
    },

    onSetText(id, text) {
      updateTree(id, item => item.text = text);
    },

    onBeforeMountComponent(id, element) {
      updateTree(id, item => item.element = element);
    },

    onBeforeUpdateComponent(id, element) {
      updateTree(id, item => item.element = element);
    },

    onMountComponent(id) {
      updateTree(id, item => item.isMounted = true);
    },

    onMountRootComponent(id) {
      rootIDs[id] = true;
    },

    onUpdateComponent(id) {
      updateTree(id, item => item.updateCount++);
    },

    onUnmountComponent(id) {
      updateTree(id, item => item.isMounted = false);
      unmountedIDs[id] = true;
      delete rootIDs[id];
    },

    purgeUnmountedComponents() {
      if (ReactComponentTreeDevtoolDev._preventPurging) {
        // Should only be used for testing.
        return;
      }

      for (var id in unmountedIDs) {
        purgeDeep(id);
      }
      unmountedIDs = {};
    },

    isMounted(id) {
      var item = tree[id];
      return item ? item.isMounted : false;
    },

    getCurrentStackAddendum(topElement) {
      var info = '';
      if (topElement) {
        var type = topElement.type;
        var name = typeof type === 'function' ?
          type.displayName || type.name :
          type;
        var owner = topElement._owner;
        info += describeComponentFrame(
          name || 'Unknown',
          topElement._source,
          owner && owner.getName()
        );
      }

      var currentOwner = ReactCurrentOwner.current;
      var id = currentOwner && currentOwner._debugID;

      info += ReactComponentTreeDevtoolDev.getStackAddendumByID(id);
      return info;
    },

    getStackAddendumByID(id) {
      var info = '';
      while (id) {
        info += describeID(id);
        id = ReactComponentTreeDevtoolDev.getParentID(id);
      }
      return info;
    },

    getChildIDs(id) {
      var item = tree[id];
      return item ? item.childIDs : [];
    },

    getDisplayName(id) {
      var item = tree[id];
      return item ? item.displayName : 'Unknown';
    },

    getElement(id) {
      var item = tree[id];
      return item ? item.element : null;
    },

    getOwnerID(id) {
      var item = tree[id];
      return item ? item.ownerID : null;
    },

    getParentID(id) {
      var item = tree[id];
      return item ? item.parentID : null;
    },

    getSource(id) {
      var item = tree[id];
      var element = item ? item.element : null;
      var source = element != null ? element._source : null;
      return source;
    },

    getText(id) {
      var item = tree[id];
      return item ? item.text : null;
    },

    getUpdateCount(id) {
      var item = tree[id];
      return item ? item.updateCount : 0;
    },

    getRootIDs() {
      return Object.keys(rootIDs);
    },

    getRegisteredIDs() {
      return Object.keys(tree);
    },
  };
}

module.exports = ReactComponentTreeDevtoolDev;
