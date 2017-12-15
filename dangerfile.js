/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const { danger, markdown, warn } = require('danger');

// Tags big PRs
var bigPRThreshold = 600;
if (danger.git.modified_files + danger.git.added_files + danger.git.deleted_files > bigPRThreshold) {
  const title = ':exclamation: Big PR';
  const files = danger.git.modified_files + danger.git.added_files + danger.git.deleted_files;
  const idea = `This PR is extremely unlikely to get reviewed because it touches ${files} files.`;
  warn(`${title} - <i>${idea}</i>`);

  markdown('@facebook-github-bot large-pr');  
}
