/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
