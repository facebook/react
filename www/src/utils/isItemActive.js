/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import slugify from 'utils/slugify';

const toAnchor = (href = '') => {
  const index = href.indexOf('#');
  return index >= 0 ? href.substr(index) : '';
};

// TODO Account for redirect_from URLs somehow; they currently won't match.
// This comment should not be true anymore since we're using 300 redirects

const isItemActive = (location, item) => {
  if (location.hash) {
    if (item.href) {
      return location.hash === toAnchor(item.href);
    }
  } else if (item.id.includes('html')) {
    return location.pathname.includes(item.id);
  } else {
    const slugId = location.pathname.split('/').slice(-1)[0];
    return slugId === slugify(item.id);
  }
};

export default isItemActive;
