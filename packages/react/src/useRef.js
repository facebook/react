/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_USE_REF_TYPE} from 'shared/ReactSymbols';

import invariant from 'fbjs/lib/invariant';

export default function useRef<Props, ElementType: React$ElementType>(
  renderProp: (props: Props, ref: React$ElementRef<ElementType>) => React$Node,
) {
  invariant(
    typeof renderProp === 'function',
    'useRef requires a render prop but was given %s.',
    renderProp === null ? 'null' : typeof renderProp,
  );

  return {
    $$typeof: REACT_USE_REF_TYPE,
    renderProp,
  };
}
