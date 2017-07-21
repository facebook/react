/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

const supportPageOffset = window.pageXOffset !== undefined;
const isCSS1Compat = (document.compatMode || '') === 'CSS1Compat';

const getScrollTop = () => {
  return supportPageOffset
    ? window.pageYOffset
    : isCSS1Compat
        ? document.documentElement.scrollTop
        : document.body.scrollTop;
};

export default getScrollTop;
