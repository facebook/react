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

export const itemName = pathname => {
  const lastSlashIndex = pathname.lastIndexOf('/');
  return pathname.substring(lastSlashIndex + 1);
};

// TODO Account for redirect_from URLs somehow; they currently won't match.
// This comment should not be true anymore since we're using 300 redirects

export const isItemActive = (location, item) => {
  if (location.hash) {
    return itemName(location.pathname) === slugify(item.id);
  } else if (item.id.includes('html')) {
    return location.pathname.includes(item.id);
  } else {
    return itemName(location.pathname) === slugify(item.id);
  }
};

export default isItemActive;
