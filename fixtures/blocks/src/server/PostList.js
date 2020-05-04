/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {Suspense, SuspenseList} from 'react';
import {preload} from 'react-data/fetch';

import loadPost from './Post.block';
import PostGlimmer from './PostGlimmer';

export default function PostList({posts}) {
  return (
    <SuspenseList revealOrder="forwards" tail="collapsed">
      {posts.map(post => {
        preload(`/comments?postId=${post.id}`);
        const Post = loadPost(post.id);
        return (
          <Suspense key={post.id} fallback={<PostGlimmer />}>
            <Post post={post} />
          </Suspense>
        );
      })}
    </SuspenseList>
  );
}
