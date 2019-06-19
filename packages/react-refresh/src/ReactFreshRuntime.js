/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Instance} from 'react-reconciler/src/ReactFiberHostConfig';
import type {FiberRoot} from 'react-reconciler/src/ReactFiberRoot';
import type {
  Family,
  RefreshUpdate,
  ScheduleRefresh,
  FindHostInstancesForRefresh,
  SetRefreshHandler,
} from 'react-reconciler/src/ReactFiberHotReloading';

import {REACT_MEMO_TYPE, REACT_FORWARD_REF_TYPE} from 'shared/ReactSymbols';
import warningWithoutStack from 'shared/warningWithoutStack';

type Signature = {|
  ownKey: string,
  forceReset: boolean,
  fullKey: string | null, // Contains keys of nested Hooks. Computed lazily.
  getCustomHooks: () => Array<Function>,
|};

// In old environments, we'll leak previous types after every edit.
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;

// We never remove these associations.
// It's OK to reference families, but use WeakMap/Set for types.
const allFamiliesByID: Map<string, Family> = new Map();
// $FlowIssue
const allTypes: WeakSet<any> | Set<any> = new PossiblyWeakSet();
const allSignaturesByType: // $FlowIssue
WeakMap<any, Signature> | Map<any, Signature> = new PossiblyWeakMap();
// This WeakMap is read by React, so we only put families
// that have actually been edited here. This keeps checks fast.
// $FlowIssue
const familiesByType: // $FlowIssue
WeakMap<any, Family> | Map<any, Family> = new PossiblyWeakMap();

// This is cleared on every performReactRefresh() call.
// It is an array of [Family, NextType] tuples.
let pendingUpdates: Array<[Family, any]> = [];

// This is injected by the renderer via DevTools global hook.
let setRefreshHandler: null | SetRefreshHandler = null;
let scheduleRefresh: null | ScheduleRefresh = null;
let findHostInstancesForRefresh: null | FindHostInstancesForRefresh = null;

let mountedRoots = new Set();

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

export function performReactRefresh(): boolean {
  if (pendingUpdates.length === 0) {
    return false;
  }

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

  const update: RefreshUpdate = {
    updatedFamilies,
    staleFamilies,
  };

  if (typeof setRefreshHandler !== 'function') {
    warningWithoutStack(
      false,
      'Could not find the setRefreshHandler() implementation. ' +
        'This likely means that injectIntoGlobalHook() was either ' +
        'called before the global DevTools hook was set up, or after the ' +
        'renderer has already initialized. Please file an issue with a reproducing case.',
    );
    return false;
  }

  if (typeof scheduleRefresh !== 'function') {
    warningWithoutStack(
      false,
      'Could not find the scheduleRefresh() implementation. ' +
        'This likely means that injectIntoGlobalHook() was either ' +
        'called before the global DevTools hook was set up, or after the ' +
        'renderer has already initialized. Please file an issue with a reproducing case.',
    );
    return false;
  }
  const scheduleRefreshForRoot = scheduleRefresh;

  // Even if there are no roots, set the handler on first update.
  // This ensures that if *new* roots are mounted, they'll use the resolve handler.
  setRefreshHandler(resolveFamily);

  let didError = false;
  let firstError = null;
  mountedRoots.forEach(root => {
    try {
      scheduleRefreshForRoot(root, update);
    } catch (err) {
      if (!didError) {
        didError = true;
        firstError = err;
      }
      // Keep trying other roots.
    }
  });
  if (didError) {
    throw firstError;
  }
  return true;
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

export function getFamilyByID(id: string): Family | void {
  return allFamiliesByID.get(id);
}

export function findAffectedHostInstances(
  families: Array<Family>,
): Set<Instance> {
  if (typeof findHostInstancesForRefresh !== 'function') {
    warningWithoutStack(
      false,
      'Could not find the findHostInstancesForRefresh() implementation. ' +
        'This likely means that injectIntoGlobalHook() was either ' +
        'called before the global DevTools hook was set up, or after the ' +
        'renderer has already initialized. Please file an issue with a reproducing case.',
    );
    return new Set();
  }
  const findInstances = findHostInstancesForRefresh;
  let affectedInstances = new Set();
  mountedRoots.forEach(root => {
    const instancesForRoot = findInstances(root, families);
    instancesForRoot.forEach(inst => {
      affectedInstances.add(inst);
    });
  });
  return affectedInstances;
}

export function injectIntoGlobalHook(globalObject: any): void {
  // For React Native, the global hook will be set up by require('react-devtools-core').
  // That code will run before us. So we need to monkeypatch functions on existing hook.

  // For React Web, the global hook will be set up by the extension.
  // This will also run before us.
  let hook = globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook === undefined) {
    // However, if there is no DevTools extension, we'll need to set up the global hook ourselves.
    // Note that in this case it's important that renderer code runs *after* this method call.
    // Otherwise, the renderer will think that there is no global hook, and won't do the injection.
    globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook = {
      supportsFiber: true,
      inject() {},
      onCommitFiberRoot(id: mixed, root: FiberRoot) {},
      onCommitFiberUnmount() {},
    };
  }

  // Here, we just want to get a reference to scheduleRefresh.
  const oldInject = hook.inject;
  hook.inject = function(injected) {
    findHostInstancesForRefresh = ((injected: any)
      .findHostInstancesForRefresh: FindHostInstancesForRefresh);
    scheduleRefresh = ((injected: any).scheduleRefresh: ScheduleRefresh);
    setRefreshHandler = ((injected: any).setRefreshHandler: SetRefreshHandler);
    return oldInject.apply(this, arguments);
  };

  // We also want to track currently mounted roots.
  const oldOnCommitFiberRoot = hook.onCommitFiberRoot;
  hook.onCommitFiberRoot = function(id: mixed, root: FiberRoot) {
    const current = root.current;
    const alternate = current.alternate;

    // We need to determine whether this root has just (un)mounted.
    // This logic is copy-pasted from similar logic in the DevTools backend.
    // If this breaks with some refactoring, you'll want to update DevTools too.

    if (alternate !== null) {
      const wasMounted =
        alternate.memoizedState != null &&
        alternate.memoizedState.element != null;
      const isMounted =
        current.memoizedState != null && current.memoizedState.element != null;

      if (!wasMounted && isMounted) {
        // Mount a new root.
        mountedRoots.add(root);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        // This doesn't affect our mounted root Set.
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        mountedRoots.delete(root);
      }
    } else {
      // Mount a new root.
      mountedRoots.add(root);
    }

    return oldOnCommitFiberRoot.apply(this, arguments);
  };
}

// Exposed for testing.
export function _getMountedRootCount() {
  return mountedRoots.size;
}
