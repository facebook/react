/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {block} from 'react';

// Server

import {fetch} from 'react-data/fetch';

function load(postId) {
  return {
    comments: fetch(`/comments?postId=${postId}`).json(),
  };
}

// Client

function Comments(props, data) {
  return (
    <>
      <h5>Comments</h5>
      <ul>
        {data.comments.slice(0, 5).map(item => (
          <li key={item.id}>{item.body}</li>
        ))}
      </ul>
    </>
  );
}

export default block(Comments, load);
