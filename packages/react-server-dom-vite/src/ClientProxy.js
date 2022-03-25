/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useState} from 'react';

declare var globalThis: any;
// eslint-disable-next-line no-unused-vars
/*global globalThis*/

type ClientProxy = {
  id: string,
  name: string,
  named: boolean,
  component: mixed,
};

// Store of components discovered during RSC to load
// them later when consuming the response in SSR.
globalThis.__COMPONENT_INDEX = {};

export const MODULE_TAG = Symbol.for('react.module.reference');
export const FN_RSC_ERROR =
  'Functions exported from client components cannot be called or used as constructors from a server component.';

// TODO what's a better way to detect Flight runtime?
// const cacheType = () => new Map();
export function isRsc() {
  try {
    useState();
    return false;
  } catch (e) {
    return true;
  }
}

function createModuleReference(id, component, name, isNamed) {
  const moduleRef = Object.create(null);
  moduleRef.$$typeof = MODULE_TAG;
  moduleRef.filepath = id;
  moduleRef.name = isNamed ? name : 'default';

  // Store component in a global index during RSC to use it later in SSR
  globalThis.__COMPONENT_INDEX[id] = Object.defineProperty(
    globalThis.__COMPONENT_INDEX[id] || Object.create(null),
    moduleRef.name,
    {value: component, writable: true},
  );

  return moduleRef;
}

// A ClientProxy behaves as a module reference for the Flight
// runtime (RSC) and as a real component for the Fizz runtime (SSR).
// Note that this is not used in browser environments.
export function wrapInClientProxy({id, name, named, component}: ClientProxy) {
  const type = typeof component;

  if (component === null || (type !== 'object' && type !== 'function')) {
    return component;
  }

  if (component.$$typeof) {
    // Make $$typeof configurable to bypass proxy invariance where
    // it cannot return a different type from its original target.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get#invariants
    component = Object.create(component, {
      $$typeof: {
        value: component.$$typeof,
        configurable: true,
      },
    });
  }

  const moduleRef = createModuleReference(id, component, name, named);
  const get = (target, prop, receiver) =>
    Reflect.get(isRsc() ? moduleRef : target, prop, receiver);

  return new Proxy(
    component,
    type === 'object'
      ? {get}
      : {
          get,
          apply() {
            if (isRsc()) throw new Error(FN_RSC_ERROR + ` Calling "${name}".`);
            return Reflect.apply(...arguments);
          },
          construct() {
            if (isRsc())
              throw new Error(FN_RSC_ERROR + ` Instantiating "${name}".`);
            return Reflect.construct(...arguments);
          },
        },
  );
}
