/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import Link from './Link';
import {useRouter} from './RouterContext';

export function TabBar({children}) {
  return (
    <div
      style={{
        border: '1px solid #aaa',
        padding: 20,
        marginBottom: 20,
        width: 500,
      }}>
      {children}
    </div>
  );
}

export function TabLink({to, partial, children}) {
  const {pendingUrl: activeUrl} = useRouter();
  const active = partial ? activeUrl.startsWith(to) : activeUrl === to;
  if (active) {
    return (
      <b
        style={{
          display: 'inline-block',
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
        marginRight: 20,
      }}
      to={to}>
      {children}
    </Link>
  );
}
