/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {block, Suspense} from 'react';
import {fetch} from './lib/data';
import loadComments from './Comments';

function load(params) {
  return {
    post: fetch('http://localhost:3001/posts/' + params.id),
    Comments: loadComments(params.id),
  };
}

function Post(props, data) {
  return (
    <>
      <h1>Post {data.post.id}</h1>
      <h4>{data.post.title}</h4>
      <p>{data.post.body}</p>
      <hr />
      <Suspense fallback={<p>Loading comments...</p>}>
        <data.Comments />
      </Suspense>
    </>
  );
}

export default block(Post, load);
