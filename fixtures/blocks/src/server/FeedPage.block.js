/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {block} from 'react';
import {fetch} from 'react-data/fetch';

// Server

import PostList from './PostList';

function load(params) {
  const allPosts = fetch('/posts?_expand=user').json();
  return {
    posts: <PostList posts={allPosts} />,
  };
}

// Client

function FeedPage(props, data) {
  return (
    <>
      <h2>Feed</h2>
      {data.posts}
    </>
  );
}

export default block(FeedPage, load);
