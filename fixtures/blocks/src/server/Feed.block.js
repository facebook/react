/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {block, Suspense, SuspenseList} from 'react';
import {fetch, preload} from 'react-data/fetch';
import loadPost from './Post.block';
import PostGlimmer from '../shared/PostGlimmer';

function load(params) {
  const posts = fetch('http://localhost:3001/posts').json();
  return {
    posts: (
      <SuspenseList revealOrder="forwards" tail="collapsed">
        {posts.map(post => {
          const Post = loadPost(post.id);
          preload('http://localhost:3001/comments?postId=' + post.id);
          return (
            <Suspense key={post.id} fallback={<PostGlimmer />}>
              <Post post={post} waitForComments={true} />
            </Suspense>
          );
        })}
      </SuspenseList>
    ),
  };
}

function Feed(props, data) {
  return (
    <>
      <h2>Feed</h2>
      <Suspense fallback={<h2>Loading...</h2>}>{data.posts}</Suspense>
    </>
  );
}

export default block(Feed, load);
