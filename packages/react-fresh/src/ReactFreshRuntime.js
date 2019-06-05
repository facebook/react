/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Family,
  HotUpdate,
} from 'react-reconciler/src/ReactFiberHotReloading';

import {REACT_MEMO_TYPE, REACT_FORWARD_REF_TYPE} from 'shared/ReactSymbols';

type Signature = {|
  key: string,
  forceReset: boolean,
  getCustomHooks: () => Array<Function>,
|};

// We never remove these associations.
// It's OK to reference families, but use WeakMap/Set for types.
const allFamiliesByID: Map<string, Family> = new Map();
const allTypes: WeakSet<any> = new WeakSet();
const allSignaturesByType: WeakMap<any, Signature> = new WeakMap();
// This WeakMap is read by React, so we only put families
// that have actually been edited here. This keeps checks fast.
const familiesByType: WeakMap<any, Family> = new WeakMap();

// This is cleared on every prepareUpdate() call.
// It is an array of [Family, NextType] tuples.
let pendingUpdates: Array<[Family, any]> = [];

function haveEqualSignatures(prevType, nextType) {
  const prevSignature = allSignaturesByType.get(prevType);
  const nextSignature = allSignaturesByType.get(nextType);

  if (prevSignature === undefined && nextSignature === undefined) {
    return true;
  }
  if (prevSignature === undefined || nextSignature === undefined) {
    return false;
  }
  if (prevSignature.key !== nextSignature.key) {
    return false;
  }
  if (nextSignature.forceReset) {
    return false;
  }

  // TODO: we might need to calculate previous signature earlier in practice,
  // such as during the first time a component is resolved. We'll revisit this.
  const prevCustomHooks = prevSignature.getCustomHooks();
  const nextCustomHooks = nextSignature.getCustomHooks();
  if (prevCustomHooks.length !== nextCustomHooks.length) {
    return false;
  }

  for (let i = 0; i < nextCustomHooks.length; i++) {
    if (!haveEqualSignatures(prevCustomHooks[i], nextCustomHooks[i])) {
      return false;
    }
  }

  return true;
}

function isReactClass(type) {
  return type.prototype && type.prototype.isReactComponent;
}

function canPreserveStateBetween(prevType, nextType) {
  if (isReactClass(prevType) || isReactClass(nextType)) {
    return false;
  }
  if (haveEqualSignatures(prevType, nextType)) {
    return true;
  }
  return false;
}

function resolveFamily(type) {
  return familiesByType.get(type);
}

export function prepareUpdate(): HotUpdate {
  const staleFamilies = new Set();
  const updatedFamilies = new Set();

  const updates = pendingUpdates;
  pendingUpdates = [];
  updates.forEach(([family, nextType]) => {
    // Now that we got a real edit, we can create associations
    // that will be read by the React reconciler.
    const prevType = family.current;
    familiesByType.set(prevType, family);
    familiesByType.set(nextType, family);
    family.current = nextType;

    // Determine whether this should be a re-render or a re-mount.
    if (canPreserveStateBetween(prevType, nextType)) {
      updatedFamilies.add(family);
    } else {
      staleFamilies.add(family);
    }
  });

  return {
    resolveFamily,
    updatedFamilies,
    staleFamilies,
  };
}

export function register(type: any, id: string): void {
  if (type === null) {
    return;
  }
  if (typeof type !== 'function' && typeof type !== 'object') {
    return;
  }

  // This can happen in an edge case, e.g. if we register
  // return value of a HOC but it returns a cached component.
  // Ignore anything but the first registration for each type.
  if (allTypes.has(type)) {
    return;
  }
  allTypes.add(type);

  // Create family or remember to update it.
  // None of this bookkeeping affects reconciliation
  // until the first prepareUpdate() call above.
  let family = allFamiliesByID.get(id);
  if (family === undefined) {
    family = {current: type};
    allFamiliesByID.set(id, family);
  } else {
    pendingUpdates.push([family, type]);
  }

  // Visit inner types because we might not have registered them.
  if (typeof type === 'object' && type !== null) {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        register(type.render, id + '$render');
        break;
      case REACT_MEMO_TYPE:
        register(type.type, id + '$type');
        break;
    }
  }
}

export function setSignature(
  type: any,
  key: string,
  forceReset?: boolean = false,
  getCustomHooks?: () => Array<Function>,
): void {
  allSignaturesByType.set(type, {
    key,
    forceReset,
    getCustomHooks: getCustomHooks || (() => []),
  });
}
