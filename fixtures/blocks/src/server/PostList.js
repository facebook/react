/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {Suspense, unstable_SuspenseList as SuspenseList} from 'react';
import {preload} from 'react-fetch';
import PostGlimmer from './PostGlimmer';
import Post from './Post';

export default function PostList({posts}) {
  return (
    <SuspenseList revealOrder="forwards" tail="collapsed">
      {posts.map(post => {
        preload(`/comments?postId=${post.id}&_expand=user`);
        return (
          <Suspense key={post.id} fallback={<PostGlimmer />}>
            <Post post={post} />
          </Suspense>
        );
      })}
    </SuspenseList>
  );
}
