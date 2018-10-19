/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ForwardRef} from './forwardRef';

import {REACT_PURE_TYPE, REACT_FORWARD_REF_TYPE} from 'shared/ReactSymbols';

import warningWithoutStack from 'shared/warningWithoutStack';

function composeComparisonFunctions(inner, outer) {
  return function(oldProps, newProps) {
    // Either is allowed to block the update.
    return outer(oldProps, newProps) || inner(oldProps, newProps);
  };
}

export default function pure<Props>(
  render: (props: Props) => React$Node | ForwardRef,
  compare?: (oldProps: Props, newProps: Props) => boolean,
) {
  if (
    typeof render === 'object' &&
    render.$$typeof === REACT_FORWARD_REF_TYPE
  ) {
    let forwardRef = (render: ForwardRef);
    if (forwardRef.compare !== undefined && forwardRef.compare !== null) {
      compare = composeComparisonFunctions(forwardRef.compare, compare);
    }
    return {
      $$typeof: REACT_FORWARD_REF_TYPE,
      render: forwardRef.render,
      compare: compare === undefined ? null : compare,
    };
  }
  if (__DEV__) {
    if (typeof render !== 'function') {
      warningWithoutStack(
        false,
        'pure: The first argument must be a function component. Instead ' +
          'received: %s',
        render === null ? 'null' : typeof render,
      );
    } else {
      const prototype = render.prototype;
      if (prototype && prototype.isReactComponent) {
        warningWithoutStack(
          false,
          'pure: The first argument must be a function component. Classes ' +
            'are not supported. Use React.PureComponent instead.',
        );
      }
    }
  }
  return {
    $$typeof: REACT_PURE_TYPE,
    render,
    compare: compare === undefined ? null : compare,
  };
}
