/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import slugify from './slugify';

/**
 * Helper method to locate the section containing the current URL/path.
 * This method specifically works with the nav_*.yml format.
 */
const findSectionForPath = (pathname, sections) => {
  let activeSection;
  const slugId = pathname.split('/').slice(-1)[0];

  sections.forEach(section => {
    const match = section.items.some(
      item =>
        slugId === slugify(item.id) ||
        (item.subitems &&
          item.subitems.some(subitem => slugId === slugify(subitem.id))),
    );
    if (match) {
      activeSection = section;
    }
  });

  return activeSection;
};

export default findSectionForPath;
