/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';

import {TabBar, TabLink} from '../client/TabNav';

export default function ProfileNav({userId}) {
  // TODO: Don't hardcode ID.
  return (
    <TabBar>
      <TabLink to={`/profile/${userId}`}>Timeline</TabLink>
      <TabLink to={`/profile/${userId}/bio`}>Bio</TabLink>
    </TabBar>
  );
}
