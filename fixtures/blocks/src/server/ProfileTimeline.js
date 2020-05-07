/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {fetch} from 'react-fetch';
import PostList from './PostList';

export default function ProfileTimeline({userId}) {
  const posts = fetch(`/posts?userId=${userId}&_expand=user`).json();
  return <PostList posts={posts} />;
}
