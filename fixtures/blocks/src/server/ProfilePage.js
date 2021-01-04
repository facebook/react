/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {Suspense} from 'react';
import {fetch} from 'react-fetch';
import {matchRoute} from './ServerRouter';
import ProfileTimeline from './ProfileTimeline';
import ProfileBio from './ProfileBio';

// TODO: Replace with asset reference.
import ProfileNav from '../client/ProfileNav';

// TODO: Router component?
const ProfileRoutes = {
  '/': props => <ProfileTimeline {...props} key="timeline" />,
  '/bio': props => <ProfileBio {...props} key="bio" />,
};

export default function ProfilePage(props) {
  const user = fetch(`/users/${props.userId}`).json();
  const match = matchRoute(props, ProfileRoutes);
  return (
    <>
      <h2>{user.name}</h2>
      <ProfileNav userId={user.id} />
      <Suspense fallback={<h3>Loading...</h3>}>{match}</Suspense>
    </>
  );
}
