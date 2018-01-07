/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {isJUnitEnabled, writeJUnitReport} = require('../shared/reporting');

if (!isJUnitEnabled() | (process.argv.length !== 5)) {
  return;
}

writeJUnitReport(process.argv[2], process.argv[3], process.argv[4] === 'true');
