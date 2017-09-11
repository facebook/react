/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 * @flow
*/

'use strict';

/**
 * Variables shared by multiple components.
 */

export default {
  // NOTE: We can't just use `location.toString()` because when we are rendering
  // the SSR part in node.js we won't have a proper location.
  // TODO: update this once we move to https://react.com
  urlRoot: 'https://facebook.github.io/react',
};
