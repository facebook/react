/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_FORWARD_REF_TYPE} from 'shared/ReactSymbols';

import warningWithoutStack from 'shared/warningWithoutStack';

export default function forwardRef<Props, ElementType: React$ElementType>(
  render: (props: Props, ref: React$Ref<ElementType>) => React$Node,
) {
  if (__DEV__) {
    if (typeof render !== 'function') {
      warningWithoutStack(
        false,
        'forwardRef requires a render function but was given %s.',
        render === null ? 'null' : typeof render,
      );
    } else {
      warningWithoutStack(
        // Do not warn for 0 arguments because it could be due to usage of the 'arguments' object
        render.length === 0 || render.length === 2,
        'forwardRef render functions accept exactly two parameters: props and ref. %s',
        render.length === 1
          ? 'Did you forget to use the ref parameter?'
          : 'Any additional parameter will be undefined.',
      );
    }

    if (render != null) {
      warningWithoutStack(
        render.defaultProps == null && render.propTypes == null,
        'forwardRef render functions do not support propTypes or defaultProps. ' +
          'Did you accidentally pass a React component?',
      );
    }
  }

  return {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render,
  };
}
