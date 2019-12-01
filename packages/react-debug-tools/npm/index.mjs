/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import dev from './esm/react-debug-tools.development.mjs';
import prod from './esm/react-debug-tools.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';

export default isProduction ? prod : dev;
