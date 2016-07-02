/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var fs = require('fs');

function buildHeader(name, version, templateFile) {
  var TEMPLATE = fs.readFileSync(templateFile, 'utf8');
  return TEMPLATE
    .replace('<%= package %>', name)
    .replace('<%= version %>', version);
}

function buildSimpleHeader(name, version) {
  return buildHeader(name, version, './gulp/data/header-template-short.txt');
}

function buildLicenseHeader(name, version) {
  return buildHeader(name, version, './gulp/data/header-template-extended.txt');
}

module.exports = {
  buildSimpleHeader,
  buildLicenseHeader
};
