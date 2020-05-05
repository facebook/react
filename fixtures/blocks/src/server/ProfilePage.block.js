/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {block, Suspense} from 'react';

// Server

import {fetch} from 'react-data/fetch';
import loadProfileBio from './ProfileBio.block';
import loadProfileTimeline from './ProfileTimeline.block';

function load(userId, tab) {
  const user = fetch(`/users/${userId}`).json();
  let Tab;
  switch (tab) {
    case 'bio':
      Tab = loadProfileBio(user);
      break;
    default:
      Tab = loadProfileTimeline(userId);
      break;
  }
  return {
    Tab,
    user,
  };
}

// Client

import {TabBar, TabLink} from '../client/TabNav';

function ProfileTabNav({userId}) {
  // TODO: Don't hardcode ID.
  return (
    <TabBar>
      <TabLink to={`/profile/${userId}`}>Timeline</TabLink>
      <TabLink to={`/profile/${userId}/bio`}>Bio</TabLink>
    </TabBar>
  );
}

function ProfilePage(props, data) {
  return (
    <>
      <h2>{data.user.name}</h2>
      <ProfileTabNav userId={data.user.id} />
      <Suspense fallback={<h3>Loading...</h3>}>
        <data.Tab />
      </Suspense>
    </>
  );
}

export default block(ProfilePage, load);
