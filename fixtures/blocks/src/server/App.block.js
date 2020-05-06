/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {unstable_block as block} from 'react';

// Server

import {matchRoute} from './ServerRouter';
import loadFeedPage from './FeedPage.block';
import loadProfilePage from './ProfilePage.block';

const AppRoutes = {
  '/': [loadFeedPage, 'home'],
  '/profile/:userId/*': [loadProfilePage, p => `profile-${p.userId}`],
};

function load(params) {
  return {
    match: matchRoute(params, AppRoutes),
  };
}

// Client

import Shell from '../client/Shell';

function App(props, data) {
  return <Shell>{data.match}</Shell>;
}

export default block(App, load);
