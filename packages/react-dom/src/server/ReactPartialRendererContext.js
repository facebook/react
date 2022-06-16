/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ThreadID} from './ReactThreadIDAllocator';
import type {ReactContext} from 'shared/ReactTypes';

import {disableLegacyContext} from 'shared/ReactFeatureFlags';
import {REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE} from 'shared/ReactSymbols';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import checkPropTypes from 'shared/checkPropTypes';

let didWarnAboutInvalidateContextType;
if (__DEV__) {
  didWarnAboutInvalidateContextType = new Set();
}

export const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

function maskContext(type, context) {
  const contextTypes = type.contextTypes;
  if (!contextTypes) {
    return emptyObject;
  }
  const maskedContext = {};
  for (const contextName in contextTypes) {
    maskedContext[contextName] = context[contextName];
  }
  return maskedContext;
}

function checkContextTypes(typeSpecs, values, location: string) {
  if (__DEV__) {
    checkPropTypes(typeSpecs, values, location, 'Component');
  }
}

export function validateContextBounds(
  context: ReactContext<any>,
  threadID: ThreadID,
) {
  // If we don't have enough slots in this context to store this threadID,
  // fill it in without leaving any holes to ensure that the VM optimizes
  // this as non-holey index properties.
  // (Note: If `react` package is < 16.6, _threadCount is undefined.)
  for (let i = context._threadCount | 0; i <= threadID; i++) {
    // We assume that this is the same as the defaultValue which might not be
    // true if we're rendering inside a secondary renderer but they are
    // secondary because these use cases are very rare.
    context[i] = context._currentValue2;
    context._threadCount = i + 1;
  }
}

export function processContext(
  type: Function,
  context: Object,
  threadID: ThreadID,
  isClass: boolean,
) {
  if (isClass) {
    const contextType = type.contextType;
    if (__DEV__) {
      if ('contextType' in (type: any)) {
        const isValid =
          // Allow null for conditional declaration
          contextType === null ||
          (contextType !== undefined &&
            contextType.$$typeof === REACT_CONTEXT_TYPE &&
            contextType._context === undefined); // Not a <Context.Consumer>

        if (!isValid && !didWarnAboutInvalidateContextType.has(type)) {
          didWarnAboutInvalidateContextType.add(type);

          let addendum = '';
          if (contextType === undefined) {
            addendum =
              ' However, it is set to undefined. ' +
              'This can be caused by a typo or by mixing up named and default imports. ' +
              'This can also happen due to a circular dependency, so ' +
              'try moving the createContext() call to a separate file.';
          } else if (typeof contextType !== 'object') {
            addendum = ' However, it is set to a ' + typeof contextType + '.';
          } else if (contextType.$$typeof === REACT_PROVIDER_TYPE) {
            addendum =
              ' Did you accidentally pass the Context.Provider instead?';
          } else if (contextType._context !== undefined) {
            // <Context.Consumer>
            addendum =
              ' Did you accidentally pass the Context.Consumer instead?';
          } else {
            addendum =
              ' However, it is set to an object with keys {' +
              Object.keys(contextType).join(', ') +
              '}.';
          }
          console.error(
            '%s defines an invalid contextType. ' +
              'contextType should point to the Context object returned by React.createContext().%s',
            getComponentNameFromType(type) || 'Component',
            addendum,
          );
        }
      }
    }
    if (typeof contextType === 'object' && contextType !== null) {
      validateContextBounds(contextType, threadID);
      return contextType[threadID];
    }
    if (disableLegacyContext) {
      if (__DEV__) {
        if (type.contextTypes) {
          console.error(
            '%s uses the legacy contextTypes API which is no longer supported. ' +
              'Use React.createContext() with static contextType instead.',
            getComponentNameFromType(type) || 'Unknown',
          );
        }
      }
      return emptyObject;
    } else {
      const maskedContext = maskContext(type, context);
      if (__DEV__) {
        if (type.contextTypes) {
          checkContextTypes(type.contextTypes, maskedContext, 'context');
        }
      }
      return maskedContext;
    }
  } else {
    if (disableLegacyContext) {
      if (__DEV__) {
        if (type.contextTypes) {
          console.error(
            '%s uses the legacy contextTypes API which is no longer supported. ' +
              'Use React.createContext() with React.useContext() instead.',
            getComponentNameFromType(type) || 'Unknown',
          );
        }
      }
      return undefined;
    } else {
      const maskedContext = maskContext(type, context);
      if (__DEV__) {
        if (type.contextTypes) {
          checkContextTypes(type.contextTypes, maskedContext, 'context');
        }
      }
      return maskedContext;
    }
  }
}
