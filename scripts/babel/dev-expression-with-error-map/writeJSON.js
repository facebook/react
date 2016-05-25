/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var path = require('path');
var fs = require('fs');

/*:: type ErrorMap = {  [id: string]: string; }; */

function writeJSON(errorObj/* : ErrorMap */, targetFilePath/* : string */) {
  var currentVersion = require('../../../package.json').version; // Ugh
  var outputObj = {
    version: currentVersion,
    data: errorObj,
  };

  fs.writeFileSync(
    path.join(__dirname, '../../../', targetFilePath),
    JSON.stringify(outputObj, null, 2)
  );
}

module.exports = writeJSON;
