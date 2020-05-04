/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import TabNav from './TabNav';

// TODO: Error Boundaries.

export default function Shell({children}) {
  return (
    <>
      <TabNav />
      <br />
      {children}
    </>
  );
}
