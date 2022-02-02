/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createElement} from 'react';

declare var globalThis: any;
// eslint-disable-next-line no-unused-vars
/*global globalThis*/

// This is a store of components discovered during RSC
// to load them later when consuming the response in SSR.
globalThis.__COMPONENT_INDEX = {};

type ClientProxy = {
  id: string,
  name: string,
  named: boolean,
  component: mixed,
};

function isReactComponent(component: any, name: string) {
  if (!component) return false;

  return (
    (typeof component === 'function' && /^[A-Z]/.test(name)) ||
    typeof component.render === 'function' ||
    component.$$typeof === Symbol.for('react.element')
  );
}

// A ClientProxy behaves as a module reference for the Flight
// runtime (RSC) and as a real component for the Fizz runtime (SSR).
// Note that this is not used in browser environments.
export function wrapInClientProxy({id, name, named, component}: ClientProxy) {
  if (!isReactComponent(component, name)) {
    // This is not a React component, do not wrap it.
    return component;
  }

  const render = (props: any) => createElement(component, props);
  Object.defineProperty(render, 'name', {value: name});

  if (__DEV__) {
    render.displayName = name;
  }

  // Fizz runtime accesses the `render` method directly when encountering a forward_ref
  const componentRef = Object.create(null);
  componentRef.$$typeof = Symbol.for('react.forward_ref');
  componentRef.render = render;

  // Flight runtime will check this custom typeof to decide wether this is a module ref
  const moduleRef = Object.create(null);
  moduleRef.$$typeof_rsc = Symbol.for('react.module.reference');
  moduleRef.filepath = id;
  moduleRef.name = named ? name : 'default';

  // Store component in a global index during RSC to use them later in SSR
  globalThis.__COMPONENT_INDEX[id] = Object.defineProperty(
    globalThis.__COMPONENT_INDEX[id] || Object.create(null),
    moduleRef.name,
    {value: component},
  );

  return new Proxy(componentRef, {
    get: (target, prop) =>
      // 1. Let React access the element/ref and type in SSR
      (target: any)[prop] ||
      // 2. Check module properties for RSC requests
      (moduleRef: any)[prop] ||
      // 3. Fallback to custom component properties such as `ImageComponent.Fragment`
      (component: any)[prop],
  });
}
