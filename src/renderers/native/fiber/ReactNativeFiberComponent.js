/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeFiberComponent
 * @flow
 */

'use strict';

var ReactNativeTagHandles = require('ReactNativeTagHandles');
var UIManager = require('UIManager');

export type Container = {
  children: Array<number>;
  _rootNodeID: number;
};

export type Props = { [key: any]: any };

export type Instance = {
  _rootNodeID: number;
  children: Array<number>;
  child: ?TextInstance;
};

export type TextInstance = {
  _rootNodeID: number;
};

function isText(maybeText: any) {
  return typeof maybeText === 'string' || typeof maybeText === 'number';
};

function createSingleChild(node: Instance, children: string, root: number) {
  // multichild -> singlechild
  const textNode = createTextInstance(children, root);
  appendChild(node, node.child = textNode);
}

function updateSingleChild(node: Instance, children: any) {
  if (isText(children) && node.child) {
    // singlechild -> singlechild
    updateTextInstance(node.child, '' + children);
  } else if (node.child) {
    // singlechild -> multichild
    const removedIndex = removeChild(node, node.child);
    UIManager.manageChildren(
      node._rootNodeID,
      [],
      [],
      [],
      [],
      [removedIndex]
    );
    node.child = null;
  }
}

function createInstance(
  type: string,
  attributes: ?Props,
  root: number
): Instance {

  const node = {
    _rootNodeID: ReactNativeTagHandles.allocateTag(),
    children: [],
    child: null,
  };

  UIManager.createView(node._rootNodeID, type, root, attributes);
  return node;
}

function createTextInstance(text: string, root: number): TextInstance {
  const tag = ReactNativeTagHandles.allocateTag();
  UIManager.createView(tag, 'RCTRawText', root, { text: text });
  return { _rootNodeID: tag };
}

function updateTextInstance(node: TextInstance, text: string): void {
  UIManager.updateView(node._rootNodeID, 'RCTRawText', { text: text });
}

function appendChild(
  parent: Instance | Container,
  child: Instance | TextInstance
): number {
  return parent.children.push(child._rootNodeID) - 1;
}

function moveChild(
  parent: Instance | Container,
  child: Instance | TextInstance
): Array<number> {
  const fromIndex = parent.children.indexOf(child._rootNodeID);
  parent.children.splice(fromIndex, 1);
  const toIndex = parent.children.push(child._rootNodeID) - 1;

  return [fromIndex, toIndex];
}

function insertBefore(
  parent: Instance | Container,
  child: Instance | TextInstance,
  before: Instance | TextInstance
): Array<number> {
  const children = parent.children;
  const beforeIndex = children.indexOf(before._rootNodeID) - 1;
  const childIndex = children.indexOf(child._rootNodeID);
  children.splice(childIndex, 1);
  children.splice(beforeIndex, 0, child._rootNodeID);

  return [childIndex, beforeIndex];
}

function removeChild(
  parent: Instance | Container,
  child: Instance | TextInstance
): number {
  const childIndex = parent.children.indexOf(child._rootNodeID);
  parent.children.splice(childIndex, 1);
  return childIndex;
}

module.exports = {
  createSingleChild: createSingleChild,
  updateSingleChild: updateSingleChild,
  createInstance: createInstance,
  createTextInstance: createTextInstance,
  updateTextInstance: updateTextInstance,
  appendChild: appendChild,
  moveChild: moveChild,
  insertBefore: insertBefore,
  removeChild: removeChild,
}
