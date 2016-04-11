/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugIntrospection
 */

'use strict';

var ReactDebugInstanceMap = require('ReactDebugInstanceMap');

function getChildren(instance) {
  if (instance._renderedComponent) {
    if (instance._renderedComponent._currentElement) {
      return [instance._renderedComponent];
    } else {
      return [];
    }
  } else if (instance._renderedChildren) {
    var children = [];
    for (var key in instance._renderedChildren) {
      children.push(instance._renderedChildren[key]);
    }
    return children;
  } else {
    return [];
  }
}

function getDisplayName(instance) {
  var element = instance._currentElement;
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else if (instance.getName) {
    return instance.getName() || 'Unknown';
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function getOwner(instance) {
  var element = instance._currentElement;
  if (element == null) {
    return null;
  }
  return element._owner;
}

function isComposite(instance) {
  var element = instance._currentElement;
  if (element == null) {
    return false;
  }
  return typeof element.type === 'function';
}

var INLINED_CHILDREN_TYPES = {'string': true, 'number': true};
var INLINE_ID_PREFIX = 'text:';

function createInlineTextID(parentInstanceID) {
  return `${INLINE_ID_PREFIX}${parentInstanceID}`;
}
function isInlineTextID(instanceID) {
  return instanceID.substr(0, INLINE_ID_PREFIX.length) === INLINE_ID_PREFIX;
}
function getParentInstanceIDOfInlineTextID(instanceID) {
  return instanceID.substr(INLINE_ID_PREFIX.length);
}

function getInlineText(instance) {
  var element = instance._currentElement;
  var props = element && element.props;
  if (props && INLINED_CHILDREN_TYPES[typeof props.children]) {
    return props.children.toString();
  }
}

var ReactDebugIntrospection = {
  getChildIDs(instanceID) {
    var instance = ReactDebugInstanceMap.getInstanceByID(instanceID);
    if (!instance) {
      return [];
    }

    var childInstances = getChildren(instance);
    var childIDs = childInstances.map(ReactDebugInstanceMap.getIDForInstance);

    // DOM components inline a single child.
    // It doesn't correspond to a real instance but we pretend that it does
    // because this is an implementation detail of the DOM renderer.
    if (!childIDs.length && getInlineText(instance)) {
      var inlineChildID = createInlineTextID(instanceID);
      childIDs.push(inlineChildID);
    }

    return childIDs;
  },

  getDisplayName(instanceID) {
    var instance = ReactDebugInstanceMap.getInstanceByID(instanceID);
    if (!instance) {
      if (isInlineTextID(instanceID)) {
        return '#text';
      } else {
        return 'Unknown';
      }
    }
    return getDisplayName(instance);
  },

  getText(instanceID) {
    var instance = ReactDebugInstanceMap.getInstanceByID(instanceID);
    if (instance) {
      return instance._stringText;
    }

    if (isInlineTextID(instanceID)) {
      var parentInstanceID = getParentInstanceIDOfInlineTextID(instanceID);
      var parentInstance = ReactDebugInstanceMap.getInstanceByID(
        parentInstanceID
      );
      if (parentInstance) {
        return getInlineText(parentInstance);
      }
    }
  },

  isComposite(instanceID) {
    var instance = ReactDebugInstanceMap.getInstanceByID(instanceID);
    if (!instance) {
      return false;
    }
    return isComposite(instance);
  },

  // TODO: make the new ReactPerf depend on element source location instead.
  unstable_getOwnerID(instanceID) {
    // Note: this method can't determine the owner for text components
    // because they are not created from real elements.
    var instance = ReactDebugInstanceMap.getInstanceByID(instanceID);
    if (!instance) {
      return null;
    }
    var owner = getOwner(instance);
    if (!owner) {
      return null;
    }
    return ReactDebugInstanceMap.getIDForInstance(owner);
  },

  // TODO: stop exposing this method when ReactDebugIntrospection provides all
  // functions that React DevTools need without exposing internal instances.
  unstable_getInternalInstanceByID(instanceID) {
    return ReactDebugInstanceMap.getInstanceByID(instanceID);
  },
};

module.exports = ReactDebugIntrospection;
