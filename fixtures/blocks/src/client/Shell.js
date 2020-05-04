/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import Link from './Link';
import {useRouter} from './RouterContext';

function TabBar({children}) {
  return (
    <div style={{border: '1px solid #aaa', padding: 20, width: 500}}>
      {children}
    </div>
  );
}

function TabLink({to, children}) {
  const {pendingUrl: activeUrl} = useRouter();
  const active = activeUrl === to;
  if (active) {
    return (
      <b
        style={{
          display: 'inline-block',
          width: 50,
          marginRight: 20,
        }}>
        {children}
      </b>
    );
  }
  return (
    <Link
      style={{
        display: 'inline-block',
        width: 50,
        marginRight: 20,
      }}
      to={to}>
      {children}
    </Link>
  );
}

// TODO: Error Boundaries.

export default function Shell({children}) {
  return (
    <>
      <TabBar>
        <TabLink to="/">Home</TabLink>
        <TabLink to="/profile/3">Profile</TabLink>
      </TabBar>
      <br />
      {children}
    </>
  );
}
