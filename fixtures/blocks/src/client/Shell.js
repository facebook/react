/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {TabBar, TabLink} from './TabNav';

// TODO: Error Boundaries.

function MainTabNav() {
  return (
    <TabBar>
      <TabLink to="/">Home</TabLink>
      <TabLink to="/profile/3" partial={true}>
        Profile
      </TabLink>
    </TabBar>
  );
}

export default function Shell({children}) {
  return (
    <>
      <MainTabNav />
      {children}
    </>
  );
}
