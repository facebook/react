/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {fetch} from 'react-data/fetch';

function load(postId) {
  return {
    comments: JSON.parse(
      fetch('http://localhost:3001/comments?postId=' + postId)
    ),
  };
}

function Comments(props, data) {
  return (
    <>
      <h3>Comments</h3>
      <ul>
        {data.comments.slice(0, 5).map(item => (
          <li key={item.id}>{item.body}</li>
        ))}
      </ul>
    </>
  );
}

export default React.block(Comments, load);
