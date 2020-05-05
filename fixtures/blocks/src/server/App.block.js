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

function load({route}) {
  const Page = matchRoute(route, [
    ['/', loadFeedPage],
    ['/profile/:userId/*', loadProfilePage],
  ]);
  return {Page};
}

// Client

import Shell from '../client/Shell';

// TODO: some notion of key.

function App(props, data) {
  return (
    <Shell>
      <data.Page />
    </Shell>
  );
}

export default block(App, load);
