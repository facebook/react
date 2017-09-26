/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
  urlRoot: 'https://reactjs.org',
};
