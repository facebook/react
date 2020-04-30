/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {block, Suspense} from 'react';
import {fetch, preload} from 'react-data/fetch';
import loadComments from './Comments';

function load(params) {
  if (params.id < 3) {
    const nextId = params.id + 1;
    preload('http://localhost:3001/posts/' + nextId);
  }
  const postResponse = fetch('http://localhost:3001/posts/' + params.id);
  return {
    post: postResponse.json(),
    meta: postResponse.status + ' ' + postResponse.statusText,
    Comments: loadComments(params.id),
  };
}

function Post(props, data) {
  return (
    <>
      <h1>Post {data.post.id}</h1>
      <h4>{data.post.title}</h4>
      <p>{data.post.body}</p>
      <pre>{data.meta}</pre>
      <hr />
      <Suspense fallback={<p>Loading comments...</p>}>
        <data.Comments />
      </Suspense>
    </>
  );
}

export default block(Post, load);
