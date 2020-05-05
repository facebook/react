/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {unstable_block as block, Suspense} from 'react';

// Server

import loadComments from './Comments.block';

function load(postId) {
  return {
    Comments: loadComments(postId),
  };
}

// Client

import Link from '../client/Link';

function Post(props, data) {
  return (
    <div
      style={{
        border: '1px solid #aaa',
        borderRadius: 10,
        marginBottom: 20,
        padding: 20,
        maxWidth: 500,
      }}>
      <h4 style={{marginTop: 0}}>
        {props.post.title}
        {' by '}
        <Link to={`/profile/${props.post.user.id}`}>
          {props.post.user.name}
        </Link>
      </h4>
      <p>{props.post.body}</p>
      <Suspense
        fallback={<h5>Loading comments...</h5>}
        unstable_avoidThisFallback={true}>
        <data.Comments />
      </Suspense>
    </div>
  );
}

export default block(Post, load);
