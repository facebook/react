/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Mock of the Native Hooks

// Map of viewTag -> {children: [childTag], parent: ?parentTag}
const roots = [];
const views = new Map();

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

  if (childInfo.parent !== null) {
    throw new Error(
      `Inserting view ${child} ${JSON.stringify(
        childInfo.props,
      )} which already has parent`,
    );
  }

  if (0 > index || index > parentInfo.children.length) {
    throw new Error(
      `Invalid index ${index} for children ${parentInfo.children}`,
    );
  }

  parentInfo.children.splice(index, 0, child);
  childInfo.parent = parent;
}

function removeChild(parent, child) {
  const parentInfo = views.get(parent);
  const childInfo = views.get(child);
  const index = parentInfo.children.indexOf(child);

  if (index < 0) {
    throw new Error(`Missing view ${child} during removal`);
  }

  parentInfo.children.splice(index, 1);
  childInfo.parent = null;
}

const RCTUIManager = {
  __dumpHierarchyForJestTestsOnly: function () {
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
    return roots.map(tag => dumpSubtree(tag, 0)).join('\n');
  },
  clearJSResponder: jest.fn(),
  createView: jest.fn(function createView(reactTag, viewName, rootTag, props) {
    if (views.has(reactTag)) {
      throw new Error(`Created two native views with tag ${reactTag}`);
    }

    views.set(reactTag, {
      children: [],
      parent: null,
      props: props,
      viewName: viewName,
    });
  }),
  dispatchViewManagerCommand: jest.fn(),
  sendAccessibilityEvent: jest.fn(),
  setJSResponder: jest.fn(),
  setChildren: jest.fn(function setChildren(parentTag, reactTags) {
    autoCreateRoot(parentTag);

    // Native doesn't actually check this but it seems like a good idea
    if (views.get(parentTag).children.length !== 0) {
      throw new Error(`Calling .setChildren on nonempty view ${parentTag}`);
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

    // This logic ported from iOS (RCTUIManager.m)
    if (moveFromIndices.length !== moveToIndices.length) {
      throw new Error(
        `Mismatched move indices ${moveFromIndices} and ${moveToIndices}`,
      );
    }

    if (addChildReactTags.length !== addAtIndices.length) {
      throw new Error(
        `Mismatched add indices ${addChildReactTags} and ${addAtIndices}`,
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
  removeSubviewsFromContainerWithID: jest.fn(function (parentTag) {
    views.get(parentTag).children.forEach(tag => removeChild(parentTag, tag));
  }),
  replaceExistingNonRootView: jest.fn(),
  measure: jest.fn(function measure(tag, callback) {
    if (typeof tag !== 'number') {
      throw new Error(`Expected tag to be a number, was passed ${tag}`);
    }

    callback(10, 10, 100, 100, 0, 0);
  }),
  measureInWindow: jest.fn(function measureInWindow(tag, callback) {
    if (typeof tag !== 'number') {
      throw new Error(`Expected tag to be a number, was passed ${tag}`);
    }

    callback(10, 10, 100, 100);
  }),
  measureLayout: jest.fn(function measureLayout(
    tag,
    relativeTag,
    fail,
    success,
  ) {
    if (typeof tag !== 'number') {
      throw new Error(`Expected tag to be a number, was passed ${tag}`);
    }

    if (typeof relativeTag !== 'number') {
      throw new Error(
        `Expected relativeTag to be a number, was passed ${relativeTag}`,
      );
    }

    success(1, 1, 100, 100);
  }),
  __takeSnapshot: jest.fn(),
};

module.exports = RCTUIManager;
