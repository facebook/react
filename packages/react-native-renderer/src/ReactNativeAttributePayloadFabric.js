/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Modules provided by RN:
import {
  deepDiffer,
  flattenStyle,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import isArray from 'shared/isArray';

import {
  enableAddPropertiesFastPath,
  enableShallowPropDiffing,
} from 'shared/ReactFeatureFlags';

import type {AttributeConfiguration} from './ReactNativeTypes';

const emptyObject = {};

/**
 * Create a payload that contains all the updates between two sets of props.
 *
 * These helpers are all encapsulated into a single module, because they use
 * mutation as a performance optimization which leads to subtle shared
 * dependencies between the code paths. To avoid this mutable state leaking
 * across modules, I've kept them isolated to this module.
 */

type NestedNode = Array<NestedNode> | Object;

// Tracks removed keys
let removedKeys: {[string]: boolean} | null = null;
let removedKeyCount = 0;

const deepDifferOptions = {
  unsafelyIgnoreFunctions: true,
};

function defaultDiffer(prevProp: mixed, nextProp: mixed): boolean {
  if (typeof nextProp !== 'object' || nextProp === null) {
    // Scalars have already been checked for equality
    return true;
  } else {
    // For objects and arrays, the default diffing algorithm is a deep compare
    return deepDiffer(prevProp, nextProp, deepDifferOptions);
  }
}

function restoreDeletedValuesInNestedArray(
  updatePayload: Object,
  node: NestedNode,
  validAttributes: AttributeConfiguration,
) {
  if (isArray(node)) {
    let i = node.length;
    while (i-- && removedKeyCount > 0) {
      restoreDeletedValuesInNestedArray(
        updatePayload,
        node[i],
        validAttributes,
      );
    }
  } else if (node && removedKeyCount > 0) {
    const obj = node;
    for (const propKey in removedKeys) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      if (!removedKeys[propKey]) {
        continue;
      }
      let nextProp = obj[propKey];
      if (nextProp === undefined) {
        continue;
      }

      const attributeConfig = validAttributes[propKey];
      if (!attributeConfig) {
        continue; // not a valid native prop
      }

      if (typeof nextProp === 'function') {
        // $FlowFixMe[incompatible-type] found when upgrading Flow
        nextProp = true;
      }
      if (typeof nextProp === 'undefined') {
        // $FlowFixMe[incompatible-type] found when upgrading Flow
        nextProp = null;
      }

      if (typeof attributeConfig !== 'object') {
        // case: !Object is the default case
        updatePayload[propKey] = nextProp;
      } else if (
        typeof attributeConfig.diff === 'function' ||
        typeof attributeConfig.process === 'function'
      ) {
        // case: CustomAttributeConfiguration
        const nextValue =
          typeof attributeConfig.process === 'function'
            ? attributeConfig.process(nextProp)
            : nextProp;
        updatePayload[propKey] = nextValue;
      }
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      removedKeys[propKey] = false;
      removedKeyCount--;
    }
  }
}

function diffNestedArrayProperty(
  updatePayload: null | Object,
  prevArray: Array<NestedNode>,
  nextArray: Array<NestedNode>,
  validAttributes: AttributeConfiguration,
): null | Object {
  const minLength =
    prevArray.length < nextArray.length ? prevArray.length : nextArray.length;
  let i;
  for (i = 0; i < minLength; i++) {
    // Diff any items in the array in the forward direction. Repeated keys
    // will be overwritten by later values.
    updatePayload = diffNestedProperty(
      updatePayload,
      prevArray[i],
      nextArray[i],
      validAttributes,
    );
  }
  for (; i < prevArray.length; i++) {
    // Clear out all remaining properties.
    updatePayload = clearNestedProperty(
      updatePayload,
      prevArray[i],
      validAttributes,
    );
  }
  for (; i < nextArray.length; i++) {
    // Add all remaining properties.
    updatePayload = addNestedProperty(
      updatePayload,
      nextArray[i],
      validAttributes,
    );
  }
  return updatePayload;
}

function diffNestedProperty(
  updatePayload: null | Object,
  prevProp: NestedNode,
  nextProp: NestedNode,
  validAttributes: AttributeConfiguration,
): null | Object {
  if (!updatePayload && prevProp === nextProp) {
    // If no properties have been added, then we can bail out quickly on object
    // equality.
    return updatePayload;
  }

  if (!prevProp || !nextProp) {
    if (nextProp) {
      return addNestedProperty(updatePayload, nextProp, validAttributes);
    }
    if (prevProp) {
      return clearNestedProperty(updatePayload, prevProp, validAttributes);
    }
    return updatePayload;
  }

  if (!isArray(prevProp) && !isArray(nextProp)) {
    // Both are leaves, we can diff the leaves.
    return diffProperties(updatePayload, prevProp, nextProp, validAttributes);
  }

  if (isArray(prevProp) && isArray(nextProp)) {
    // Both are arrays, we can diff the arrays.
    return diffNestedArrayProperty(
      updatePayload,
      prevProp,
      nextProp,
      validAttributes,
    );
  }

  if (isArray(prevProp)) {
    return diffProperties(
      updatePayload,
      flattenStyle(prevProp),
      nextProp,
      validAttributes,
    );
  }

  return diffProperties(
    updatePayload,
    prevProp,
    flattenStyle(nextProp),
    validAttributes,
  );
}

/**
 * addNestedProperty takes a single set of props and valid attribute
 * attribute configurations. It processes each prop and adds it to the
 * updatePayload.
 */
function addNestedProperty(
  updatePayload: null | Object,
  nextProp: NestedNode,
  validAttributes: AttributeConfiguration,
): $FlowFixMe {
  if (!nextProp) {
    return updatePayload;
  }

  if (!isArray(nextProp)) {
    // Add each property of the leaf.
    return addProperties(updatePayload, nextProp, validAttributes);
  }

  for (let i = 0; i < nextProp.length; i++) {
    // Add all the properties of the array.
    updatePayload = addNestedProperty(
      updatePayload,
      nextProp[i],
      validAttributes,
    );
  }

  return updatePayload;
}

/**
 * clearNestedProperty takes a single set of props and valid attributes. It
 * adds a null sentinel to the updatePayload, for each prop key.
 */
function clearNestedProperty(
  updatePayload: null | Object,
  prevProp: NestedNode,
  validAttributes: AttributeConfiguration,
): null | Object {
  if (!prevProp) {
    return updatePayload;
  }

  if (!isArray(prevProp)) {
    // Add each property of the leaf.
    return clearProperties(updatePayload, prevProp, validAttributes);
  }

  for (let i = 0; i < prevProp.length; i++) {
    // Add all the properties of the array.
    updatePayload = clearNestedProperty(
      updatePayload,
      prevProp[i],
      validAttributes,
    );
  }
  return updatePayload;
}

/**
 * diffProperties takes two sets of props and a set of valid attributes
 * and write to updatePayload the values that changed or were deleted.
 * If no updatePayload is provided, a new one is created and returned if
 * anything changed.
 */
function diffProperties(
  updatePayload: null | Object,
  prevProps: Object,
  nextProps: Object,
  validAttributes: AttributeConfiguration,
): null | Object {
  let attributeConfig;
  let nextProp;
  let prevProp;

  for (const propKey in nextProps) {
    attributeConfig = validAttributes[propKey];
    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    prevProp = prevProps[propKey];
    nextProp = nextProps[propKey];

    // functions are converted to booleans as markers that the associated
    // events should be sent from native.
    if (typeof nextProp === 'function') {
      nextProp = (true: any);
      // If nextProp is not a function, then don't bother changing prevProp
      // since nextProp will win and go into the updatePayload regardless.
      if (typeof prevProp === 'function') {
        prevProp = (true: any);
      }
    }

    // An explicit value of undefined is treated as a null because it overrides
    // any other preceding value.
    if (typeof nextProp === 'undefined') {
      nextProp = (null: any);
      if (typeof prevProp === 'undefined') {
        prevProp = (null: any);
      }
    }

    if (removedKeys) {
      removedKeys[propKey] = false;
    }

    if (updatePayload && updatePayload[propKey] !== undefined) {
      // Something else already triggered an update to this key because another
      // value diffed. Since we're now later in the nested arrays our value is
      // more important so we need to calculate it and override the existing
      // value. It doesn't matter if nothing changed, we'll set it anyway.

      // Pattern match on: attributeConfig
      if (typeof attributeConfig !== 'object') {
        // case: !Object is the default case
        updatePayload[propKey] = nextProp;
      } else if (
        typeof attributeConfig.diff === 'function' ||
        typeof attributeConfig.process === 'function'
      ) {
        // case: CustomAttributeConfiguration
        const nextValue =
          typeof attributeConfig.process === 'function'
            ? attributeConfig.process(nextProp)
            : nextProp;
        updatePayload[propKey] = nextValue;
      }
      continue;
    }

    if (prevProp === nextProp) {
      continue; // nothing changed
    }

    // Pattern match on: attributeConfig
    if (typeof attributeConfig !== 'object') {
      // case: !Object is the default case
      if (enableShallowPropDiffing || defaultDiffer(prevProp, nextProp)) {
        // a normal leaf has changed
        (updatePayload || (updatePayload = ({}: {[string]: $FlowFixMe})))[
          propKey
        ] = nextProp;
      }
    } else if (
      typeof attributeConfig.diff === 'function' ||
      typeof attributeConfig.process === 'function'
    ) {
      // case: CustomAttributeConfiguration
      const shouldUpdate =
        enableShallowPropDiffing ||
        prevProp === undefined ||
        (typeof attributeConfig.diff === 'function'
          ? attributeConfig.diff(prevProp, nextProp)
          : defaultDiffer(prevProp, nextProp));
      if (shouldUpdate) {
        const nextValue =
          typeof attributeConfig.process === 'function'
            ? // $FlowFixMe[incompatible-use] found when upgrading Flow
              attributeConfig.process(nextProp)
            : nextProp;
        (updatePayload || (updatePayload = ({}: {[string]: $FlowFixMe})))[
          propKey
        ] = nextValue;
      }
    } else {
      // default: fallthrough case when nested properties are defined
      removedKeys = null;
      removedKeyCount = 0;
      // We think that attributeConfig is not CustomAttributeConfiguration at
      // this point so we assume it must be AttributeConfiguration.
      updatePayload = diffNestedProperty(
        updatePayload,
        prevProp,
        nextProp,
        ((attributeConfig: any): AttributeConfiguration),
      );
      if (removedKeyCount > 0 && updatePayload) {
        restoreDeletedValuesInNestedArray(
          updatePayload,
          nextProp,
          ((attributeConfig: any): AttributeConfiguration),
        );
        removedKeys = null;
      }
    }
  }

  // Also iterate through all the previous props to catch any that have been
  // removed and make sure native gets the signal so it can reset them to the
  // default.
  for (const propKey in prevProps) {
    if (nextProps[propKey] !== undefined) {
      continue; // we've already covered this key in the previous pass
    }
    attributeConfig = validAttributes[propKey];
    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    if (updatePayload && updatePayload[propKey] !== undefined) {
      // This was already updated to a diff result earlier.
      continue;
    }

    prevProp = prevProps[propKey];
    if (prevProp === undefined) {
      continue; // was already empty anyway
    }
    // Pattern match on: attributeConfig
    if (
      typeof attributeConfig !== 'object' ||
      typeof attributeConfig.diff === 'function' ||
      typeof attributeConfig.process === 'function'
    ) {
      // case: CustomAttributeConfiguration | !Object
      // Flag the leaf property for removal by sending a sentinel.
      (updatePayload || (updatePayload = ({}: {[string]: $FlowFixMe})))[
        propKey
      ] = null;
      if (!removedKeys) {
        removedKeys = ({}: {[string]: boolean});
      }
      if (!removedKeys[propKey]) {
        removedKeys[propKey] = true;
        removedKeyCount++;
      }
    } else {
      // default:
      // This is a nested attribute configuration where all the properties
      // were removed so we need to go through and clear out all of them.
      updatePayload = clearNestedProperty(
        updatePayload,
        prevProp,
        ((attributeConfig: any): AttributeConfiguration),
      );
    }
  }
  return updatePayload;
}

function fastAddProperties(
  payload: null | Object,
  props: Object,
  validAttributes: AttributeConfiguration,
): null | Object {
  // Flatten nested style props.
  if (isArray(props)) {
    for (let i = 0; i < props.length; i++) {
      payload = fastAddProperties(payload, props[i], validAttributes);
    }
    return payload;
  }

  for (const propKey in props) {
    const prop = props[propKey];

    const attributeConfig = ((validAttributes[
      propKey
    ]: any): AttributeConfiguration);

    if (attributeConfig == null) {
      continue;
    }

    let newValue;

    if (prop === undefined) {
      // Discard the prop if it was previously defined.
      if (payload && payload[propKey] !== undefined) {
        newValue = null;
      } else {
        continue;
      }
    } else if (typeof prop === 'function') {
      // A function prop. It represents an event handler. Pass it to native as 'true'.
      newValue = true;
    } else if (typeof attributeConfig !== 'object') {
      // An atomic prop. Doesn't need to be flattened.
      newValue = prop;
    } else if (typeof attributeConfig.process === 'function') {
      // An atomic prop with custom processing.
      newValue = attributeConfig.process(prop);
    } else if (typeof attributeConfig.diff === 'function') {
      // An atomic prop with custom diffing. We don't need to do diffing when adding props.
      newValue = prop;
    }

    if (newValue !== undefined) {
      if (!payload) {
        payload = ({}: {[string]: $FlowFixMe});
      }
      payload[propKey] = newValue;
      continue;
    }

    payload = fastAddProperties(payload, prop, attributeConfig);
  }

  return payload;
}

/**
 * addProperties adds all the valid props to the payload after being processed.
 */
function addProperties(
  updatePayload: null | Object,
  props: Object,
  validAttributes: AttributeConfiguration,
): null | Object {
  return diffProperties(updatePayload, emptyObject, props, validAttributes);
}

/**
 * clearProperties clears all the previous props by adding a null sentinel
 * to the payload for each valid key.
 */
function clearProperties(
  updatePayload: null | Object,
  prevProps: Object,
  validAttributes: AttributeConfiguration,
): null | Object {
  // TODO: Fast path
  return diffProperties(updatePayload, prevProps, emptyObject, validAttributes);
}

export function create(
  props: Object,
  validAttributes: AttributeConfiguration,
): null | Object {
  if (enableAddPropertiesFastPath) {
    return fastAddProperties(null, props, validAttributes);
  } else {
    return addProperties(null, props, validAttributes);
  }
}

export function diff(
  prevProps: Object,
  nextProps: Object,
  validAttributes: AttributeConfiguration,
): null | Object {
  return diffProperties(
    null, // updatePayload
    prevProps,
    nextProps,
    validAttributes,
  );
}
