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

import navCommunity from '../../../docs/_data/nav_community.yml';
import navContributing from '../../../docs/_data/nav_contributing.yml';
import navDocs from '../../../docs/_data/nav_docs.yml';
import navTutorial from '../../../docs/_data/nav_tutorial.yml';

const sectionListDocs = navDocs
  .map(item => ({
    ...item,
    directory: 'docs',
  }))
  .concat(
    navContributing.map(item => ({
      ...item,
      directory: 'contributing',
    })),
  );

const sectionListCommunity = navCommunity.map(item => ({
  ...item,
  directory: 'community',
}));

export {
  sectionListCommunity,
  sectionListDocs,
  navTutorial as sectionListTutorial,
};
