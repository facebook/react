/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createElement} from 'react';

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

export function wrapInClientProxy({id, name, named, component}: ClientProxy) {
  if (!isReactComponent(component, name)) {
    // This is not a React component, return it as is.
    return component;
  }

  // Use object syntax here to make sure the function name
  // comes from the meta params for better error stacks.
  const render = {
    [name]: (props: any) => createElement(component, props),
  }[name];

  if (__DEV__) {
    render.displayName = name;
  }

  // React accesses the `render` function directly when encountring this type
  const componentRef = Object.create(null);
  componentRef.$$typeof = Symbol.for('react.forward_ref');
  componentRef.render = render;

  // This custom type is checked in RSC renderer
  const rscDescriptor = Object.create(null);
  rscDescriptor.$$typeof_rsc = Symbol.for('react.module.reference');
  rscDescriptor.filepath = id;
  rscDescriptor.name = named ? name : 'default';

  return new Proxy(componentRef, {
    get: (target, prop) =>
      // 1. Let React access the element/ref and type in SSR
      (target: any)[prop] ||
      // 2. Check descriptor properties for RSC requests
      (rscDescriptor: any)[prop] ||
      // 3. Fallback to custom component properties such as `ImageComponent.Fragment`
      (component: any)[prop],
  });
}
