/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {Suspense} from 'react';
import PostGlimmer from './PostGlimmer';
import Feed from './Feed';

export default function FeedPage() {
  return (
    <Suspense fallback={<PostGlimmer />}>
      <Feed />
    </Suspense>
  );
}
