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

/*:: type ErrorMap = {  [id: string]: string; }; */

function getCurrentErrorMap(targetFile/* : string */)/* : ?ErrorMap */ {
  var targetFilePath = path.join(__dirname, '../../../', targetFile);
  
  try {
    // flow doesn't support this dynamic `require()`
    var targetVersion = require(targetFilePath);
    return targetVersion;
  } catch (e) {
    return null;
  }
}

module.exports = getCurrentErrorMap;
