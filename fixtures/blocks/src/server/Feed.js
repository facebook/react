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

export default function Feed() {
  const posts = fetch('/posts?_expand=user').json();
  return (
    <>
      <h2>Feed</h2>
      <PostList posts={posts} />
    </>
  );
}
