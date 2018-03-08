/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_USE_REF_TYPE} from 'shared/ReactSymbols';

export default function useRef<Props, ElementType: React$ElementType>(
  callback: (props: Props, ref: React$ElementRef<ElementType>) => React$Node,
) {
  return {
    $$typeof: REACT_USE_REF_TYPE,
    callback,
  };
}
