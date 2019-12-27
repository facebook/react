/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent} from 'shared/ReactLazyComponent';

import {Resolved, initializeLazyComponentType} from 'shared/ReactLazyComponent';

export function resolveDefaultProps(Component: any, baseProps: Object): Object {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (let propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}

export function readLazyComponentType<T>(lazyComponent: LazyComponent<T>): T {
  initializeLazyComponentType(lazyComponent);
  if (lazyComponent._status !== Resolved) {
    throw lazyComponent._result;
  }
  return lazyComponent._result;
}
