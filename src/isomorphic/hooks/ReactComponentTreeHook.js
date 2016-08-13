/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponentTreeHook
 */

'use strict';

var ReactCurrentOwner = require('ReactCurrentOwner');

var invariant = require('invariant');
var warning = require('warning');

function isNative(fn) {
  // Based on isNative() from Lodash
  var funcToString = Function.prototype.toString;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var reIsNative = RegExp('^' + funcToString
    // Take an example native function source for comparison
    .call(hasOwnProperty)
    // Strip regex characters so we can use it for regex
    .replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
    // Remove hasOwnProperty from the template to make it generic
    .replace(
      /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
      '$1.*?'
    ) + '$'
  );
  try {
    var source = funcToString.call(fn);
    return reIsNative.test(source);
  } catch (err) {
    return false;
  }
}

var itemMap;
var itemByKey;

var canUseMap = (
  typeof Array.from === 'function' &&
  typeof Map === 'function' &&
  isNative(Map)
);

if (canUseMap) {
  itemMap = new Map();
} else {
  itemByKey = {};
}

var unmountedIDs = [];
var rootIDs = [];

// Use non-numeric keys to prevent V8 performance issues:
// https://github.com/facebook/react/pull/7232
function getKeyFromID(id) {
  return '.' + id;
}
function getIDFromKey(key) {
  return parseInt(key.substr(1), 10);
}

function get(id) {
  if (canUseMap) {
    return itemMap.get(id);
  }
  var key = getKeyFromID(id);
  return itemByKey[key];
}

function remove(id) {
  if (canUseMap) {
    itemMap.delete(id);
    return;
  }
  var key = getKeyFromID(id);
  delete itemByKey[key];
}

function create(id, element, parentID) {
  var item = {
    element,
    parentID,
    text: null,
    childIDs: [],
    isMounted: false,
    updateCount: 0,
  };
  if (canUseMap) {
    itemMap.set(id, item);
    return;
  }
  var key = getKeyFromID(id);
  itemByKey[key] = item;
}

function purgeDeep(id) {
  var item = get(id);
  if (item) {
    var {childIDs} = item;
    remove(id);
    childIDs.forEach(purgeDeep);
  }
}

function describeComponentFrame(name, source, ownerName) {
  return '\n    in ' + name + (
    source ?
      ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' +
      source.lineNumber + ')' :
    ownerName ?
      ' (created by ' + ownerName + ')' :
      ''
  );
}

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function describeID(id) {
  var name = ReactComponentTreeHook.getDisplayName(id);
  var element = ReactComponentTreeHook.getElement(id);
  var ownerID = ReactComponentTreeHook.getOwnerID(id);
  var ownerName;
  if (ownerID) {
    ownerName = ReactComponentTreeHook.getDisplayName(ownerID);
  }
  warning(
    element,
    'ReactComponentTreeHook: Missing React element for debugID %s when ' +
    'building stack',
    id
  );
  return describeComponentFrame(name, element && element._source, ownerName);
}

var ReactComponentTreeHook = {
  onSetChildren(id, nextChildIDs) {
    var item = get(id);
    item.childIDs = nextChildIDs;

    for (var i = 0; i < nextChildIDs.length; i++) {
      var nextChildID = nextChildIDs[i];
      var nextChild = get(nextChildID);
      invariant(
        nextChild,
        'Expected hook events to fire for the child ' +
        'before its parent includes it in onSetChildren().'
      );
      invariant(
        nextChild.childIDs != null ||
        typeof nextChild.element !== 'object' ||
        nextChild.element == null,
        'Expected onSetChildren() to fire for a container child ' +
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
        'Expected onBeforeMountComponent() parent and onSetChildren() to ' +
        'be consistent (%s has parents %s and %s).',
        nextChildID,
        nextChild.parentID,
        id
      );
    }
  },

  onBeforeMountComponent(id, element, parentID) {
    create(id, element, parentID);
  },

  onBeforeUpdateComponent(id, element) {
    var item = get(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.element = element;
  },

  onMountComponent(id) {
    var item = get(id);
    item.isMounted = true;
    if (item.parentID === 0) {
      rootIDs.push(id);
    }
  },

  onUpdateComponent(id) {
    var item = get(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.updateCount++;
  },

  onUnmountComponent(id) {
    var item = get(id);
    if (item) {
      // We need to check if it exists.
      // `item` might not exist if it is inside an error boundary, and a sibling
      // error boundary child threw while mounting. Then this instance never
      // got a chance to mount, but it still gets an unmounting event during
      // the error boundary cleanup.
      item.isMounted = false;
      if (item.parentID === 0) {
        var indexInRootIDs = rootIDs.indexOf(id);
        if (indexInRootIDs !== -1) {
          rootIDs.splice(indexInRootIDs, 1);
        }
      }
    }
    unmountedIDs.push(id);
  },

  purgeUnmountedComponents() {
    if (ReactComponentTreeHook._preventPurging) {
      // Should only be used for testing.
      return;
    }

    for (var i = 0; i < unmountedIDs.length; i++) {
      var id = unmountedIDs[i];
      purgeDeep(id);
    }
    unmountedIDs.length = 0;
  },

  isMounted(id) {
    var item = get(id);
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

    info += ReactComponentTreeHook.getStackAddendumByID(id);
    return info;
  },

  getStackAddendumByID(id) {
    var info = '';
    while (id) {
      info += describeID(id);
      id = ReactComponentTreeHook.getParentID(id);
    }
    return info;
  },

  getChildIDs(id) {
    var item = get(id);
    return item ? item.childIDs : [];
  },

  getDisplayName(id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element) {
      return null;
    }
    return getDisplayName(element);
  },

  getElement(id) {
    var item = get(id);
    return item ? item.element : null;
  },

  getOwnerID(id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element || !element._owner) {
      return null;
    }
    return element._owner._debugID;
  },

  getParentID(id) {
    var item = get(id);
    return item ? item.parentID : null;
  },

  getSource(id) {
    var item = get(id);
    var element = item ? item.element : null;
    var source = element != null ? element._source : null;
    return source;
  },

  getText(id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (typeof element === 'string') {
      return element;
    } else if (typeof element === 'number') {
      return '' + element;
    } else {
      return null;
    }
  },

  getUpdateCount(id) {
    var item = get(id);
    return item ? item.updateCount : 0;
  },

  getRootIDs() {
    return rootIDs;
  },

  getRegisteredIDs() {
    if (canUseMap) {
      return Array.from(itemMap.keys());
    }
    return Object.keys(itemByKey).map(getIDFromKey);
  },
};

module.exports = ReactComponentTreeHook;
