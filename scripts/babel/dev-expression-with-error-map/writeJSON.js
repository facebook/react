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

/*:: import type { ErrorMap } from './Types' */

var path = require('path');
var fs = require('fs');

function writeJSON(
  errorObj/* : ErrorMap */,
  targetFile/* : string */,
  currentReactVersion/* : string */
) {
  var outputObj = {
    version: currentReactVersion,
    data: errorObj,
  };

  fs.writeFileSync(
    path.join(__dirname, '../../../', targetFile),
    JSON.stringify(outputObj, null, 2)
  );
}

module.exports = writeJSON;
