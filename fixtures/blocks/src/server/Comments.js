/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {fetch} from 'react-fetch';

// TODO: Replace with asset reference.
import Link from '../client/Link';

export default function Comments({postId}) {
  const comments = fetch(`/comments?postId=${postId}&_expand=user`).json();
  return (
    <>
      <h5>Comments</h5>
      <ul>
        {comments.slice(0, 5).map(comment => (
          <li key={comment.id}>
            {comment.body}
            {' • '}
            <Link to={`/profile/${comment.user.id}`}>{comment.user.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
