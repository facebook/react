/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
