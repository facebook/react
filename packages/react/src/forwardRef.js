/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_USE_REF_TYPE} from 'shared/ReactSymbols';

import warning from 'fbjs/lib/warning';

export default function forwardRef<Props, ElementType: React$ElementType>(
  renderFn: (props: Props, ref: React$ElementRef<ElementType>) => React$Node,
) {
  if (__DEV__) {
    warning(
      typeof renderFn === 'function',
      'forwardRef requires a render function but was given %s.',
      renderFn === null ? 'null' : typeof renderFn,
    );
  }

  return {
    $$typeof: REACT_USE_REF_TYPE,
    renderFn,
  };
}
