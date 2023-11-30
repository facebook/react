/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export * from './index.experimental.js';

if (__DEV__) {
  console.error(
    'The `react-dom/server-rendering-stub` entrypoint is deprecated and no longer necessary because `react-dom` only includes exports which are appropriate for any environment, Server Components, Server Side Rendering, and the Browser. Update your program to no longer alias `react-dom` to `react-dom/server-rendering-stub`.',
  );
}
