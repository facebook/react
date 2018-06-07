/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_FORWARD_REF_TYPE} from 'shared/ReactSymbols';

import warning from 'fbjs/lib/warning';

export default function forwardRef<Props, ElementType: React$ElementType>(
  render: (props: Props, ref: React$ElementRef<ElementType>) => React$Node,
) {
  if (__DEV__) {
    warning(
      typeof render === 'function',
      'forwardRef requires a render function but was given %s.',
      render === null ? 'null' : typeof render,
    );

    if (render != null) {
      warning(
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
