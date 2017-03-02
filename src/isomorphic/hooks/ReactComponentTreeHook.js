/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ReactComponentTreeHook
 */

'use strict';

import type { ReactElement, Source } from 'ReactElementType';
import type { DebugID } from 'ReactInstanceType';
import type { Fiber } from 'ReactFiber';

var getComponentName = require('getComponentName');
var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
} = ReactTypeOfWork;

function describeComponentFrame(name, source, ownerName) {
  return '\n    in ' + (name || 'Unknown') + (
    source ?
      ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' +
      source.lineNumber + ')' :
    ownerName ?
      ' (created by ' + ownerName + ')' :
      ''
  );
}

function describeFiber(fiber : Fiber) : string {
  switch (fiber.tag) {
    case IndeterminateComponent:
    case FunctionalComponent:
    case ClassComponent:
    case HostComponent:
      var owner = fiber._debugOwner;
      var source = fiber._debugSource;
      var name = getComponentName(fiber);
      var ownerName = null;
      if (owner) {
        ownerName = getComponentName(owner);
      }
      return describeComponentFrame(name, source, ownerName);
    default:
      return '';
  }
}

export type ComponentTreeHookType = {
  getStackAddendumByWorkInProgressFiber: (Fiber) => any,
  getStackAddendumByID?: () => any,
  getCurrentStackAddendum?: () => any,
  purgeUnmountedComponents?: () => any,
  getOwnerID?: (DebugID) => any,
  getParentID?: (DebugID) => any,
  getDisplayName?: (DebugID) => any,
  getText?: (DebugID) => any,
  getUpdateCount?: (DebugID) => any,
  getChildIDs?: (DebugID) => any,
  getRegisteredIDs?: () => any,
};

var ReactComponentTreeHook: ComponentTreeHookType = {
  // This function can only be called with a work-in-progress fiber and
  // only during begin or complete phase. Do not call it under any other
  // circumstances.
  getStackAddendumByWorkInProgressFiber(workInProgress : Fiber) : string {
    var info = '';
    var node = workInProgress;
    do {
      info += describeFiber(node);
      // Otherwise this return pointer might point to the wrong tree:
      node = node.return;
    } while (node);
    return info;
  },
};

if (__DEV__) {
  var ReactCurrentOwner = require('ReactCurrentOwner');
  var invariant = require('fbjs/lib/invariant');
  var warning = require('fbjs/lib/warning');

  var isNative = function(fn) {
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
  };

  var canUseCollections = (
    // Array.from
    typeof Array.from === 'function' &&
    // Map
    typeof Map === 'function' &&
    isNative(Map) &&
    // Map.prototype.keys
    Map.prototype != null &&
    typeof Map.prototype.keys === 'function' &&
    isNative(Map.prototype.keys) &&
    // Set
    typeof Set === 'function' &&
    isNative(Set) &&
    // Set.prototype.keys
    Set.prototype != null &&
    typeof Set.prototype.keys === 'function' &&
    isNative(Set.prototype.keys)
  );

  var setItem;
  var getItem;
  var removeItem;
  var getItemIDs;
  var addRoot;
  var removeRoot;
  var getRootIDs;

  if (canUseCollections) {
    var itemMap = new Map();
    var rootIDSet = new Set();

    setItem = function(id, item) {
      itemMap.set(id, item);
    };
    getItem = function(id) {
      return itemMap.get(id);
    };
    removeItem = function(id) {
      itemMap.delete(id);
    };
    getItemIDs = function() {
      return Array.from(itemMap.keys());
    };

    addRoot = function(id) {
      rootIDSet.add(id);
    };
    removeRoot = function(id) {
      rootIDSet.delete(id);
    };
    getRootIDs = function() {
      return Array.from(rootIDSet.keys());
    };

  } else {
    var itemByKey = {};
    var rootByKey = {};

    // Use non-numeric keys to prevent V8 performance issues:
    // https://github.com/facebook/react/pull/7232
    var getKeyFromID = function(id: DebugID): string {
      return '.' + id;
    };
    var getIDFromKey = function(key: string): DebugID {
      return parseInt(key.substr(1), 10);
    };

    setItem = function(id, item) {
      var key = getKeyFromID(id);
      itemByKey[key] = item;
    };
    getItem = function(id) {
      var key = getKeyFromID(id);
      return itemByKey[key];
    };
    removeItem = function(id) {
      var key = getKeyFromID(id);
      delete itemByKey[key];
    };
    getItemIDs = function() {
      return Object.keys(itemByKey).map(getIDFromKey);
    };

    addRoot = function(id) {
      var key = getKeyFromID(id);
      rootByKey[key] = true;
    };
    removeRoot = function(id) {
      var key = getKeyFromID(id);
      delete rootByKey[key];
    };
    getRootIDs = function() {
      return Object.keys(rootByKey).map(getIDFromKey);
    };
  }

  const unmountedIDs: Array<DebugID> = [];

  const purgeDeep = function(id) {
    var item = getItem(id);
    if (item) {
      var {childIDs} = item;
      removeItem(id);
      childIDs.forEach(purgeDeep);
    }
  };

  const getDisplayNameFromElement = function(element: ?ReactElement): string {
    if (element == null) {
      return '#empty';
    } else if (typeof element === 'string' || typeof element === 'number') {
      return '#text';
    } else if (typeof element.type === 'string') {
      return element.type;
    } else {
      return element.type.displayName || element.type.name || 'Unknown';
    }
  };

  const getDisplayName = function(id: DebugID): ?string {
    var element = getElement(id);
    if (!element) {
      return null;
    }
    return getDisplayNameFromElement(element);
  };

  const getOwnerID = function(id: DebugID): ?DebugID {
    var element = getElement(id);
    if (!element || !element._owner) {
      return null;
    }
    return element._owner._debugID;
  };  

  const describeID = function(id: DebugID): string {
    var name = getDisplayName(id);
    var element = getElement(id);
    var ownerID = getOwnerID(id);
    var ownerName;
    if (ownerID) {
      ownerName = getDisplayName(ownerID);
    }
    warning(
      element,
      'ReactComponentTreeHook: Missing React element for debugID %s when ' +
      'building stack',
      id
    );
    return describeComponentFrame(name, element && element._source, ownerName);
  };

  const getElement = function(id: DebugID): ?ReactElement {
    var item = getItem(id);
    return item ? item.element : null;
  };

  const getParentID = function(id: DebugID): ?DebugID {
    var item = getItem(id);
    return item ? item.parentID : null;
  };

  const getStackAddendumByID = function(id: ?DebugID): string {
    var info = '';
    while (id) {
      info += describeID(id);
      id = getParentID(id);
    }
    return info;
  };

  ReactComponentTreeHook = Object.assign({}, ReactComponentTreeHook, {
    onSetChildren(id: DebugID, nextChildIDs: Array<DebugID>): void {
      var item = getItem(id);
      invariant(item, 'Item must have been set');
      item.childIDs = nextChildIDs;

      for (var i = 0; i < nextChildIDs.length; i++) {
        var nextChildID = nextChildIDs[i];
        var nextChild = getItem(nextChildID);
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
          // be purged from our tree data so their parent id is missing.
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

    onBeforeMountComponent(id: DebugID, element: ReactElement, parentID: DebugID): void {
      var item = {
        element,
        parentID,
        text: null,
        childIDs: [],
        isMounted: false,
        updateCount: 0,
      };
      setItem(id, item);
    },

    onBeforeUpdateComponent(id: DebugID, element: ReactElement): void {
      var item = getItem(id);
      if (!item || !item.isMounted) {
        // We may end up here as a result of setState() in componentWillUnmount().
        // In this case, ignore the element.
        return;
      }
      item.element = element;
    },

    onMountComponent(id: DebugID): void {
      var item = getItem(id);
      invariant(item, 'Item must have been set');
      item.isMounted = true;
      var isRoot = item.parentID === 0;
      if (isRoot) {
        addRoot(id);
      }
    },

    onUpdateComponent(id: DebugID): void {
      var item = getItem(id);
      if (!item || !item.isMounted) {
        // We may end up here as a result of setState() in componentWillUnmount().
        // In this case, ignore the element.
        return;
      }
      item.updateCount++;
    },

    onUnmountComponent(id: DebugID): void {
      var item = getItem(id);
      if (item) {
        // We need to check if it exists.
        // `item` might not exist if it is inside an error boundary, and a sibling
        // error boundary child threw while mounting. Then this instance never
        // got a chance to mount, but it still gets an unmounting event during
        // the error boundary cleanup.
        item.isMounted = false;
        var isRoot = item.parentID === 0;
        if (isRoot) {
          removeRoot(id);
        }
      }
      unmountedIDs.push(id);
    },

    purgeUnmountedComponents(): void {
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

    isMounted(id: DebugID): boolean {
      var item = getItem(id);
      return item ? item.isMounted : false;
    },

    getCurrentStackAddendum(topElement: ?ReactElement): string {
      var info = '';
      if (topElement) {
        var name = getDisplayNameFromElement(topElement);
        var owner = topElement._owner;
        info += describeComponentFrame(
          name,
          topElement._source,
          owner && getComponentName(owner)
        );
      }

      var currentOwner = ReactCurrentOwner.current;
      if (currentOwner) {
        if (typeof currentOwner.tag === 'number') {
          const workInProgress = ((currentOwner : any) : Fiber);
          // Safe because if current owner exists, we are reconciling,
          // and it is guaranteed to be the work-in-progress version.
          info += ReactComponentTreeHook.getStackAddendumByWorkInProgressFiber(workInProgress);
        } else if (typeof currentOwner._debugID === 'number') {
          info += getStackAddendumByID(currentOwner._debugID);
        }
      }
      return info;
    },

    getStackAddendumByID,

    getChildIDs(id: DebugID): Array<DebugID> {
      var item = getItem(id);
      return item ? item.childIDs : [];
    },

    getDisplayName(id: DebugID): ?string {
      var element = getElement(id);
      if (!element) {
        return null;
      }
      return getDisplayNameFromElement(element);
    },

    getElement,

    getOwnerID,

    getParentID,

    getSource(id: DebugID): ?Source {
      var item = getItem(id);
      var element = item ? item.element : null;
      var source = element != null ? element._source : null;
      return source;
    },

    getText(id: DebugID): ?string {
      var element = getElement(id);
      if (typeof element === 'string') {
        return element;
      } else if (typeof element === 'number') {
        return '' + element;
      } else {
        return null;
      }
    },

    getUpdateCount(id: DebugID): number {
      var item = getItem(id);
      return item ? item.updateCount : 0;
    },

    getRootIDs,
    getRegisteredIDs: getItemIDs,
  });
}

module.exports = ReactComponentTreeHook;
