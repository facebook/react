/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import assign from 'shared/assign';
import {disableDefaultPropsExceptForClasses} from 'shared/ReactFeatureFlags';

export function resolveDefaultPropsOnNonClassComponent(
  Component: any,
  baseProps: Object,
): Object {
  if (disableDefaultPropsExceptForClasses) {
    // Support for defaultProps is removed in React 19 for all types
    // except classes.
    return baseProps;
  }
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}
