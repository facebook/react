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
import loadProfileTimeline from './ProfileTimeline.block';

function load(userId) {
  return {
    user: fetch(`/users/${userId}`).json(),
    ProfileTimeline: loadProfileTimeline(userId),
  };
}

// Client

function ProfilePage(props, data) {
  return (
    <>
      <h2>{data.user.name}</h2>
      <Suspense fallback={<h3>Loading Timeline...</h3>}>
        <data.ProfileTimeline />
      </Suspense>
    </>
  );
}

export default block(ProfilePage, load);
