/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import FeedPage from './FeedPage';
import ProfilePage from './ProfilePage';

const AppRoutes = {
  '/': props => <FeedPage {...props} key="home" />,
  '/profile/:userId/*': props => (
    <ProfilePage {...props} key={`profile-${props.userId}`} />
  ),
};

export default AppRoutes;
