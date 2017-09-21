/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import {createElement} from 'glamor/react';

/**
 * Convenience component for declaring a flexbox layout.
 */
const Flex = ({
  basis = 'auto',
  children,
  className,
  direction = 'row',
  grow = 0,
  halign = 'flex-start',
  shrink = 1,
  type = 'div',
  valign = 'flex-start',
  ...rest
}) =>
  createElement(
    type,
    {
      className,
      css: {
        display: 'flex',
        flexDirection: direction,
        flexGrow: grow,
        flexShrink: shrink,
        flexBasis: basis,
        justifyContent: direction === 'row' ? halign : valign,
        alignItems: direction === 'row' ? valign : halign,
      },
      ...rest,
    },
    children,
  );

export default Flex;
