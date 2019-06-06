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
  ownKey: string,
  forceReset: boolean,
  fullKey: string | null, // Contains keys of nested Hooks. Computed lazily.
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

function computeFullKey(signature: Signature): string {
  if (signature.fullKey !== null) {
    return signature.fullKey;
  }

  let fullKey: string = signature.ownKey;
  let hooks;
  try {
    hooks = signature.getCustomHooks();
  } catch (err) {
    // This can happen in an edge case, e.g. if expression like Foo.useSomething
    // depends on Foo which is lazily initialized during rendering.
    // In that case just assume we'll have to remount.
    signature.forceReset = true;
    signature.fullKey = fullKey;
    return fullKey;
  }

  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    if (typeof hook !== 'function') {
      // Something's wrong. Assume we need to remount.
      signature.forceReset = true;
      signature.fullKey = fullKey;
      return fullKey;
    }
    const nestedHookSignature = allSignaturesByType.get(hook);
    if (nestedHookSignature === undefined) {
      // No signature means Hook wasn't in the source code, e.g. in a library.
      // We'll skip it because we can assume it won't change during this session.
      continue;
    }
    const nestedHookKey = computeFullKey(nestedHookSignature);
    if (nestedHookSignature.forceReset) {
      signature.forceReset = true;
    }
    fullKey += '\n---\n' + nestedHookKey;
  }

  signature.fullKey = fullKey;
  return fullKey;
}

function haveEqualSignatures(prevType, nextType) {
  const prevSignature = allSignaturesByType.get(prevType);
  const nextSignature = allSignaturesByType.get(nextType);

  if (prevSignature === undefined && nextSignature === undefined) {
    return true;
  }
  if (prevSignature === undefined || nextSignature === undefined) {
    return false;
  }
  if (computeFullKey(prevSignature) !== computeFullKey(nextSignature)) {
    return false;
  }
  if (nextSignature.forceReset) {
    return false;
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
    forceReset,
    ownKey: key,
    fullKey: null,
    getCustomHooks: getCustomHooks || (() => []),
  });
}

// This is lazily called during first render for a type.
// It captures Hook list at that time so inline requires don't break comparisons.
export function collectCustomHooksForSignature(type: any) {
  const signature = allSignaturesByType.get(type);
  if (signature !== undefined) {
    computeFullKey(signature);
  }
}
