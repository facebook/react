/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

// Mock of the Native Hooks

const ReactNativeTagHandles = require('ReactNativeTagHandles');
const invariant = require('fbjs/lib/invariant');

// Map of viewTag -> {children: [childTag], parent: ?parentTag}
const roots = [];
let views = new Map();

function autoCreateRoot(tag) {
  // Seriously, this is how we distinguish roots in RN.
  if (!views.has(tag) && ReactNativeTagHandles.reactTagIsNativeTopRootID(tag)) {
    roots.push(tag);
    views.set(tag, {
      children: [],
      parent: null,
      props: {},
      viewName: '<native root>',
    });
  }
}

function insertSubviewAtIndex(parent, child, index) {
  const parentInfo = views.get(parent);
  const childInfo = views.get(child);
  invariant(
    childInfo.parent === null,
    'Inserting view %s %s which already has parent',
    child,
    JSON.stringify(childInfo.props),
  );
  invariant(
    0 <= index && index <= parentInfo.children.length,
    'Invalid index %s for children %s',
    index,
    parentInfo.children,
  );
  parentInfo.children.splice(index, 0, child);
  childInfo.parent = parent;
}

function removeChild(parent, child) {
  const parentInfo = views.get(parent);
  const childInfo = views.get(child);
  const index = parentInfo.children.indexOf(child);
  invariant(index >= 0, 'Missing view %s during removal', child);
  parentInfo.children.splice(index, 1);
  childInfo.parent = null;
}

var RCTUIManager = {
  __dumpHierarchyForJestTestsOnly: function() {
    return roots.map(tag => dumpSubtree(tag, 0)).join('\n');

    function dumpSubtree(tag, indent) {
      const info = views.get(tag);
      let out = '';
      out += ' '.repeat(indent) +
        info.viewName +
        ' ' +
        JSON.stringify(info.props);
      for (const child of info.children) {
        out += '\n' + dumpSubtree(child, indent + 2);
      }
      return out;
    }
  },
  clearJSResponder: jest.fn(),
  createView: jest.fn(function createView(reactTag, viewName, rootTag, props) {
    invariant(
      !views.has(reactTag),
      'Created two native views with tag %s',
      reactTag,
    );
    views.set(reactTag, {
      children: [],
      parent: null,
      props: props,
      viewName: viewName,
    });
  }),
  setJSResponder: jest.fn(),
  setChildren: jest.fn(function setChildren(parentTag, reactTags) {
    autoCreateRoot(parentTag);
    /* TODO (spicyj) Re-enable this check once it won't cause test failures
    // Native doesn't actually check this but it seems like a good idea
    invariant(
      views.get(parentTag).children.length === 0,
      'Calling .setChildren on nonempty view %s',
      parentTag,
    );
    */
    // This logic ported from iOS (RCTUIManager.m)
    reactTags.forEach((tag, i) => {
      insertSubviewAtIndex(parentTag, tag, i);
    });
  }),
  manageChildren: jest.fn(function manageChildren(parentTag, moveFromIndices = [
  ], moveToIndices = [], addChildReactTags = [], addAtIndices = [
  ], removeAtIndices = []) {
    autoCreateRoot(parentTag);
    // This logic ported from iOS (RCTUIManager.m)
    invariant(
      moveFromIndices.length === moveToIndices.length,
      'Mismatched move indices %s and %s',
      moveFromIndices,
      moveToIndices,
    );
    invariant(
      addChildReactTags.length === addAtIndices.length,
      'Mismatched add indices %s and %s',
      addChildReactTags,
      addAtIndices,
    );
    const parentInfo = views.get(parentTag);
    const permanentlyRemovedChildren = removeAtIndices.map(
      index => parentInfo.children[index],
    );
    const temporarilyRemovedChildren = moveFromIndices.map(
      index => parentInfo.children[index],
    );
    permanentlyRemovedChildren.forEach(tag => removeChild(parentTag, tag));
    temporarilyRemovedChildren.forEach(tag => removeChild(parentTag, tag));
    permanentlyRemovedChildren.forEach(tag => {
      views.delete(tag);
    });
    // List of [index, tag]
    const indicesToInsert = [];
    temporarilyRemovedChildren.forEach((tag, i) => {
      indicesToInsert.push([moveToIndices[i], temporarilyRemovedChildren[i]]);
    });
    addChildReactTags.forEach((tag, i) => {
      indicesToInsert.push([addAtIndices[i], addChildReactTags[i]]);
    });
    indicesToInsert.sort((a, b) => a[0] - b[0]);
    for (const [i, tag] of indicesToInsert) {
      insertSubviewAtIndex(parentTag, tag, i);
    }
  }),
  updateView: jest.fn(),
  removeSubviewsFromContainerWithID: jest.fn(),
  replaceExistingNonRootView: jest.fn(),
  __takeSnapshot: jest.fn(),
  customBubblingEventTypes: {
    topBlur: {
      phasedRegistrationNames: {
        bubbled: 'onBlur',
        captured: 'onBlurCapture',
      },
    },
    topFocus: {
      phasedRegistrationNames: {
        bubbled: 'onFocus',
        captured: 'onFocusCapture',
      },
    },
    topTouchCancel: {
      phasedRegistrationNames: {
        bubbled: 'onTouchCancel',
        captured: 'onTouchCancelCapture',
      },
    },
    topTouchEnd: {
      phasedRegistrationNames: {
        bubbled: 'onTouchEnd',
        captured: 'onTouchEndCapture',
      },
    },
    topTouchMove: {
      phasedRegistrationNames: {
        bubbled: 'onTouchMove',
        captured: 'onTouchMoveCapture',
      },
    },
    topTouchStart: {
      phasedRegistrationNames: {
        bubbled: 'onTouchStart',
        captured: 'onTouchStartCapture',
      },
    },
  },
  customDirectEventTypes: {
    topAccessibilityTap: {
      registrationName: 'onAccessibilityTap',
    },
    topTextLayout: {
      registrationName: 'onTextLayout',
    },
  },
};

module.exports = RCTUIManager;
