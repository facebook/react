/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var path = require('path');

function shouldConstructNewMap(targetFile/* : string */) {
  var currentVersion = require('../../../package.json').version;
  try {
    var targetFilePath = path.join(__dirname, '../../../', targetFile);
    var targetVersion = require(targetFilePath).version;
    return targetVersion !== currentVersion;
  } catch (e) {
    return true;
  }
}

module.exports = shouldConstructNewMap;
