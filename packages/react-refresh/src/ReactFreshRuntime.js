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
  ScheduleRoot,
  FindHostInstancesForRefresh,
  SetRefreshHandler,
} from 'react-reconciler/src/ReactFiberHotReloading';
import type {ReactNodeList} from 'shared/ReactTypes';

import {REACT_MEMO_TYPE, REACT_FORWARD_REF_TYPE} from 'shared/ReactSymbols';
import warningWithoutStack from 'shared/warningWithoutStack';

type Signature = {|
  ownKey: string,
  forceReset: boolean,
  fullKey: string | null, // Contains keys of nested Hooks. Computed lazily.
  getCustomHooks: () => Array<Function>,
|};

if (!__DEV__) {
  throw new Error(
    'React Refresh runtime should not be included in the production bundle.',
  );
}

// In old environments, we'll leak previous types after every edit.
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

// We never remove these associations.
// It's OK to reference families, but use WeakMap/Set for types.
const allFamiliesByID: Map<string, Family> = new Map();
const allFamiliesByType: // $FlowIssue
WeakMap<any, Family> | Map<any, Family> = new PossiblyWeakMap();
const allSignaturesByType: // $FlowIssue
WeakMap<any, Signature> | Map<any, Signature> = new PossiblyWeakMap();
// This WeakMap is read by React, so we only put families
// that have actually been edited here. This keeps checks fast.
// $FlowIssue
const updatedFamiliesByType: // $FlowIssue
WeakMap<any, Family> | Map<any, Family> = new PossiblyWeakMap();

// This is cleared on every performReactRefresh() call.
// It is an array of [Family, NextType] tuples.
let pendingUpdates: Array<[Family, any]> = [];

// This is injected by the renderer via DevTools global hook.
let setRefreshHandler: null | SetRefreshHandler = null;
let scheduleRefresh: null | ScheduleRefresh = null;
let scheduleRoot: null | ScheduleRoot = null;
let findHostInstancesForRefresh: null | FindHostInstancesForRefresh = null;

// We keep track of mounted roots so we can schedule updates.
let mountedRoots: Set<FiberRoot> = new Set();
// If a root captures an error, we add its element to this Map so we can retry on edit.
let failedRoots: Map<FiberRoot, ReactNodeList> = new Map();
let didSomeRootFailOnMount = false;

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
  // Only check updated types to keep lookups fast.
  return updatedFamiliesByType.get(type);
}

export function performReactRefresh(): RefreshUpdate | null {
  if (__DEV__) {
    if (pendingUpdates.length === 0) {
      return null;
    }

    const staleFamilies = new Set();
    const updatedFamilies = new Set();

    const updates = pendingUpdates;
    pendingUpdates = [];
    updates.forEach(([family, nextType]) => {
      // Now that we got a real edit, we can create associations
      // that will be read by the React reconciler.
      const prevType = family.current;
      updatedFamiliesByType.set(prevType, family);
      updatedFamiliesByType.set(nextType, family);
      family.current = nextType;

      // Determine whether this should be a re-render or a re-mount.
      if (canPreserveStateBetween(prevType, nextType)) {
        updatedFamilies.add(family);
      } else {
        staleFamilies.add(family);
      }
    });

    // TODO: rename these fields to something more meaningful.
    const update: RefreshUpdate = {
      updatedFamilies, // Families that will re-render preserving state
      staleFamilies, // Families that will be remounted
    };

    if (typeof setRefreshHandler !== 'function') {
      warningWithoutStack(
        false,
        'Could not find the setRefreshHandler() implementation. ' +
          'This likely means that injectIntoGlobalHook() was either ' +
          'called before the global DevTools hook was set up, or after the ' +
          'renderer has already initialized. Please file an issue with a reproducing case.',
      );
      return null;
    }

    if (typeof scheduleRefresh !== 'function') {
      warningWithoutStack(
        false,
        'Could not find the scheduleRefresh() implementation. ' +
          'This likely means that injectIntoGlobalHook() was either ' +
          'called before the global DevTools hook was set up, or after the ' +
          'renderer has already initialized. Please file an issue with a reproducing case.',
      );
      return null;
    }
    if (typeof scheduleRoot !== 'function') {
      warningWithoutStack(
        false,
        'Could not find the scheduleRoot() implementation. ' +
          'This likely means that injectIntoGlobalHook() was either ' +
          'called before the global DevTools hook was set up, or after the ' +
          'renderer has already initialized. Please file an issue with a reproducing case.',
      );
      return null;
    }
    const scheduleRefreshForRoot = scheduleRefresh;
    const scheduleRenderForRoot = scheduleRoot;

    // Even if there are no roots, set the handler on first update.
    // This ensures that if *new* roots are mounted, they'll use the resolve handler.
    setRefreshHandler(resolveFamily);

    let didError = false;
    let firstError = null;
    failedRoots.forEach((element, root) => {
      try {
        scheduleRenderForRoot(root, element);
      } catch (err) {
        if (!didError) {
          didError = true;
          firstError = err;
        }
        // Keep trying other roots.
      }
    });
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
    return update;
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function register(type: any, id: string): void {
  if (__DEV__) {
    if (type === null) {
      return;
    }
    if (typeof type !== 'function' && typeof type !== 'object') {
      return;
    }

    // This can happen in an edge case, e.g. if we register
    // return value of a HOC but it returns a cached component.
    // Ignore anything but the first registration for each type.
    if (allFamiliesByType.has(type)) {
      return;
    }
    // Create family or remember to update it.
    // None of this bookkeeping affects reconciliation
    // until the first performReactRefresh() call above.
    let family = allFamiliesByID.get(id);
    if (family === undefined) {
      family = {current: type};
      allFamiliesByID.set(id, family);
    } else {
      pendingUpdates.push([family, type]);
    }
    allFamiliesByType.set(type, family);

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
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function setSignature(
  type: any,
  key: string,
  forceReset?: boolean = false,
  getCustomHooks?: () => Array<Function>,
): void {
  if (__DEV__) {
    allSignaturesByType.set(type, {
      forceReset,
      ownKey: key,
      fullKey: null,
      getCustomHooks: getCustomHooks || (() => []),
    });
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

// This is lazily called during first render for a type.
// It captures Hook list at that time so inline requires don't break comparisons.
export function collectCustomHooksForSignature(type: any) {
  if (__DEV__) {
    const signature = allSignaturesByType.get(type);
    if (signature !== undefined) {
      computeFullKey(signature);
    }
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function getFamilyByID(id: string): Family | void {
  if (__DEV__) {
    return allFamiliesByID.get(id);
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function getFamilyByType(type: any): Family | void {
  if (__DEV__) {
    return allFamiliesByType.get(type);
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function findAffectedHostInstances(
  families: Array<Family>,
): Set<Instance> {
  if (__DEV__) {
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
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function injectIntoGlobalHook(globalObject: any): void {
  if (__DEV__) {
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
        onCommitFiberRoot(
          id: mixed,
          root: FiberRoot,
          maybePriorityLevel: mixed,
          didError: boolean,
        ) {},
        onCommitFiberUnmount() {},
      };
    }

    // Here, we just want to get a reference to scheduleRefresh.
    const oldInject = hook.inject;
    hook.inject = function(injected) {
      findHostInstancesForRefresh = ((injected: any)
        .findHostInstancesForRefresh: FindHostInstancesForRefresh);
      scheduleRefresh = ((injected: any).scheduleRefresh: ScheduleRefresh);
      scheduleRoot = ((injected: any).scheduleRoot: ScheduleRoot);
      setRefreshHandler = ((injected: any)
        .setRefreshHandler: SetRefreshHandler);
      return oldInject.apply(this, arguments);
    };

    // We also want to track currently mounted roots.
    const oldOnCommitFiberRoot = hook.onCommitFiberRoot;
    hook.onCommitFiberRoot = function(
      id: mixed,
      root: FiberRoot,
      maybePriorityLevel: mixed,
      didError: boolean,
    ) {
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
          current.memoizedState != null &&
          current.memoizedState.element != null;

        if (!wasMounted && isMounted) {
          // Mount a new root.
          mountedRoots.add(root);
          failedRoots.delete(root);
        } else if (wasMounted && isMounted) {
          // Update an existing root.
          // This doesn't affect our mounted root Set.
        } else if (wasMounted && !isMounted) {
          // Unmount an existing root.
          mountedRoots.delete(root);
          if (didError) {
            // We'll remount it on future edits.
            // Remember what was rendered so we can restore it.
            failedRoots.set(root, alternate.memoizedState.element);
          }
        } else if (!wasMounted && !isMounted) {
          if (didError && !failedRoots.has(root)) {
            // The root had an error during the initial mount.
            // We can't read its last element from the memoized state
            // because there was no previously committed alternate.
            // Ideally, it would be nice if we had a way to extract
            // the last attempted rendered element, but accessing the update queue
            // would tie this package too closely to the reconciler version.
            // So instead, we just set a flag.
            // TODO: Maybe we could fix this as the same time as when we fix
            // DevTools to not depend on `alternate.memoizedState.element`.
            didSomeRootFailOnMount = true;
          }
        }
      } else {
        // Mount a new root.
        mountedRoots.add(root);
      }

      return oldOnCommitFiberRoot.apply(this, arguments);
    };
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function hasUnrecoverableErrors() {
  return didSomeRootFailOnMount;
}

// Exposed for testing.
export function _getMountedRootCount() {
  if (__DEV__) {
    return mountedRoots.size;
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

// This is a wrapper over more primitive functions for setting signature.
// Signatures let us decide whether the Hook order has changed on refresh.
//
// This function is intended to be used as a transform target, e.g.:
// var _s = createSignatureFunctionForTransform()
//
// function Hello() {
//   const [foo, setFoo] = useState(0);
//   const value = useCustomHook();
//   _s(); /* Second call triggers collecting the custom Hook list.
//          * This doesn't happen during the module evaluation because we
//          * don't want to change the module order with inline requires.
//          * Next calls are noops. */
//   return <h1>Hi</h1>;
// }
//
// /* First call specifies the signature: */
// _s(
//   Hello,
//   'useState{[foo, setFoo]}(0)',
//   () => [useCustomHook], /* Lazy to avoid triggering inline requires */
// );
export function createSignatureFunctionForTransform() {
  if (__DEV__) {
    let call = 0;
    let savedType;
    let hasCustomHooks;
    return function<T>(
      type: T,
      key: string,
      forceReset?: boolean,
      getCustomHooks?: () => Array<Function>,
    ): T {
      switch (call++) {
        case 0:
          savedType = type;
          hasCustomHooks = typeof getCustomHooks === 'function';
          setSignature(type, key, forceReset, getCustomHooks);
          break;
        case 1:
          if (hasCustomHooks) {
            collectCustomHooksForSignature(savedType);
          }
          break;
      }
      return type;
    };
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}

export function isLikelyComponentType(type: any): boolean {
  if (__DEV__) {
    switch (typeof type) {
      case 'function': {
        // First, deal with classes.
        if (type.prototype != null) {
          if (type.prototype.isReactComponent) {
            // React class.
            return true;
          }
          const ownNames = Object.getOwnPropertyNames(type.prototype);
          if (ownNames.length > 1 || ownNames[0] !== 'constructor') {
            // This looks like a class.
            return false;
          }
          // eslint-disable-next-line no-proto
          if (type.prototype.__proto__ !== Object.prototype) {
            // It has a superclass.
            return false;
          }
          // Pass through.
          // This looks like a regular function with empty prototype.
        }
        // For plain functions and arrows, use name as a heuristic.
        const name = type.name || type.displayName;
        return typeof name === 'string' && /^[A-Z]/.test(name);
      }
      case 'object': {
        if (type != null) {
          switch (type.$$typeof) {
            case REACT_FORWARD_REF_TYPE:
            case REACT_MEMO_TYPE:
              // Definitely React components.
              return true;
            default:
              return false;
          }
        }
        return false;
      }
      default: {
        return false;
      }
    }
  } else {
    throw new Error(
      'Unexpected call to React Refresh in a production environment.',
    );
  }
}
