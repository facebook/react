/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

throw new Error(
  'React PG cannot be used outside a react-server environment. ' +
    'You must configure Node.js using the `--conditions react-server` flag.',
);
