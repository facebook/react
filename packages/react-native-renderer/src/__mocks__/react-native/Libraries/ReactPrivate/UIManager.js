/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react-internal/warning-and-invariant-args */

'use strict';

// Mock of the Native Hooks

import invariant from 'shared/invariant';

// Map of viewTag -> {children: [childTag], parent: ?parentTag}
const roots = [];
let views = new Map();

function autoCreateRoot(tag) {
  // Seriously, this is how we distinguish roots in RN.
  if (!views.has(tag) && tag % 10 === 1) {
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

  if (!(childInfo.parent === null)) {
    invariant(
      'Inserting view %s %s which already has parent',
      child,
      JSON.stringify(childInfo.props),
    );
  }

  if (!(0 <= index && index <= parentInfo.children.length)) {
    invariant('Invalid index %s for children %s', index, parentInfo.children);
  }

  parentInfo.children.splice(index, 0, child);
  childInfo.parent = parent;
}

function removeChild(parent, child) {
  const parentInfo = views.get(parent);
  const childInfo = views.get(child);
  const index = parentInfo.children.indexOf(child);

  if (!(index >= 0)) {
    invariant('Missing view %s during removal', child);
  }

  parentInfo.children.splice(index, 1);
  childInfo.parent = null;
}

const RCTUIManager = {
  __dumpHierarchyForJestTestsOnly: function() {
    return roots.map(tag => dumpSubtree(tag, 0)).join('\n');

    function dumpSubtree(tag, indent) {
      const info = views.get(tag);
      let out = '';
      out +=
        ' '.repeat(indent) + info.viewName + ' ' + JSON.stringify(info.props);
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (const child of info.children) {
        out += '\n' + dumpSubtree(child, indent + 2);
      }
      return out;
    }
  },
  clearJSResponder: jest.fn(),
  createView: jest.fn(function createView(reactTag, viewName, rootTag, props) {
    if (views.has(reactTag)) {
      invariant('Created two native views with tag %s', reactTag);
    }

    views.set(reactTag, {
      children: [],
      parent: null,
      props: props,
      viewName: viewName,
    });
  }),
  dispatchViewManagerCommand: jest.fn(),
  setJSResponder: jest.fn(),
  setChildren: jest.fn(function setChildren(parentTag, reactTags) {
    autoCreateRoot(parentTag);

    if (!(views.get(parentTag).children.length === 0)) {
      // Native doesn't actually check this but it seems like a good idea
      invariant('Calling .setChildren on nonempty view %s', parentTag);
    }

    // This logic ported from iOS (RCTUIManager.m)
    reactTags.forEach((tag, i) => {
      insertSubviewAtIndex(parentTag, tag, i);
    });
  }),
  manageChildren: jest.fn(function manageChildren(
    parentTag,
    moveFromIndices = [],
    moveToIndices = [],
    addChildReactTags = [],
    addAtIndices = [],
    removeAtIndices = [],
  ) {
    autoCreateRoot(parentTag);

    if (!(moveFromIndices.length === moveToIndices.length)) {
      // This logic ported from iOS (RCTUIManager.m)
      invariant(
        'Mismatched move indices %s and %s',
        moveFromIndices,
        moveToIndices,
      );
    }

    if (!(addChildReactTags.length === addAtIndices.length)) {
      invariant(
        'Mismatched add indices %s and %s',
        addChildReactTags,
        addAtIndices,
      );
    }

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
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const [i, tag] of indicesToInsert) {
      insertSubviewAtIndex(parentTag, tag, i);
    }
  }),
  updateView: jest.fn(),
  removeSubviewsFromContainerWithID: jest.fn(function(parentTag) {
    views.get(parentTag).children.forEach(tag => removeChild(parentTag, tag));
  }),
  replaceExistingNonRootView: jest.fn(),
  measure: jest.fn(function measure(tag, callback) {
    if (!(typeof tag === 'number')) {
      invariant('Expected tag to be a number, was passed %s', tag);
    }

    callback(10, 10, 100, 100, 0, 0);
  }),
  measureInWindow: jest.fn(function measureInWindow(tag, callback) {
    if (!(typeof tag === 'number')) {
      invariant('Expected tag to be a number, was passed %s', tag);
    }

    callback(10, 10, 100, 100);
  }),
  measureLayout: jest.fn(function measureLayout(
    tag,
    relativeTag,
    fail,
    success,
  ) {
    if (!(typeof tag === 'number')) {
      invariant('Expected tag to be a number, was passed %s', tag);
    }

    if (!(typeof relativeTag === 'number')) {
      invariant(
        'Expected relativeTag to be a number, was passed %s',
        relativeTag,
      );
    }

    success(1, 1, 100, 100);
  }),
  __takeSnapshot: jest.fn(),
};

module.exports = RCTUIManager;
