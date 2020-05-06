/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {Suspense} from 'react';
import Comments from './Comments';

// TODO: Replace with asset reference.
import Link from '../client/Link';

export default function Post({post}) {
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
        {post.title}
        {' by '}
        <Link to={`/profile/${post.user.id}`}>{post.user.name}</Link>
      </h4>
      <p>{post.body}</p>
      <Suspense
        fallback={<h5>Loading comments...</h5>}
        unstable_avoidThisFallback={true}>
        <Comments postId={post.id} />
      </Suspense>
    </div>
  );
}
