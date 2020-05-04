/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {useRouter} from './RouterContext';

function TabBar({children}) {
  return (
    <div style={{border: '1px solid #aaa', padding: 20, width: 500}}>
      {children}
    </div>
  );
}

function TabLink({to, children}) {
  const {url: activeUrl, navigate} = useRouter();
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
    <a
      style={{
        display: 'inline-block',
        width: 50,
        marginRight: 20,
      }}
      href={to}
      onClick={e => {
        e.preventDefault();
        window.history.pushState(null, null, to);
        navigate(to);
      }}>
      {children}
    </a>
  );
}

export default function Shell({children}) {
  return (
    <>
      <TabBar>
        <TabLink to="/">Home</TabLink>
        <TabLink to="/profile">Profile</TabLink>
      </TabBar>
      <br />
      {children}
    </>
  );
}
