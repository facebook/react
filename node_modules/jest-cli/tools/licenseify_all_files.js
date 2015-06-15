/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
var FileFinder = require('node-find-files');
var fs = require('fs');
var path = require('path');

var EXTRACT_DOCBLOCK_REGEX = /^\s*(\/\*\*?(?:.|\r?\n)*?\*\/)/;
var IS_JSHINT_DOCBLOCK = /\/\*\*?\s*jshint\s+[a-zA-Z0-9]+\s*:\s*[a-zA-Z0-9]+/;

var ROOT_DIR = path.resolve(__dirname, '..');

var EXAMPLES_DIR = path.join(ROOT_DIR, 'examples');
var COVERAGE_TEMPLATE_PATH = path.join(ROOT_DIR, 'src', 'coverageTemplate.js');
var NODE_MODULES_DIR = path.join(ROOT_DIR, 'node_modules');
var VENDOR_DIR = path.join(ROOT_DIR, 'vendor');
var WEBSITE_DIR = path.join(ROOT_DIR, 'website');

var LICENSE_HEADER = [
  ' * Copyright (c) 2014, Facebook, Inc. All rights reserved.',
  ' *',
  ' * This source code is licensed under the BSD-style license found in the',
  ' * LICENSE file in the root directory of this source tree. An additional ' +
                                                                    'grant',
  ' * of patent rights can be found in the PATENTS file in the same directory.',
].join('\n');

function needsLicenseHeader(fileData) {
  if (/^#!/.test(fileData)) {
    fileData = fileData.split('\n');
    fileData.shift();
    fileData = fileData.join('\n');
  }
  return fileData.indexOf(LICENSE_HEADER) === -1;
}

function addLicenseHeader(fileData) {
  var preamble = '';
  var epilogue = '\n */'

  if (/^#!/.test(fileData)) {
    fileData = fileData.split('\n');
    preamble += fileData.shift() + '\n';
    fileData = fileData.join('\n');
  }

  preamble += '/**\n';

  var startingDocblock = EXTRACT_DOCBLOCK_REGEX.exec(fileData);
  if (startingDocblock && !IS_JSHINT_DOCBLOCK.test(startingDocblock)) {
    startingDocblock = startingDocblock[0];

    fileData = fileData.substr(startingDocblock.length);

    // Strip of starting/ending tokens
    var strippedDocblock =
      startingDocblock
        .replace(/^\/\*\*?\s*/, '')
        .replace(/\s*\*\/$/, '');

    if (strippedDocblock.trim().charAt(0) !== '*') {
      strippedDocblock = '* ' + strippedDocblock.trim();
    }

    epilogue = '\n *\n ' + strippedDocblock + epilogue;
  }


  return preamble + LICENSE_HEADER + epilogue + '\n' + fileData;
}

function main() {
  var finder = new FileFinder({
    rootFolder: ROOT_DIR,
    filterFunction: function(pathStr) {
      return (
        pathStr !== COVERAGE_TEMPLATE_PATH
        && pathStr.substr(0, EXAMPLES_DIR.length) !== EXAMPLES_DIR
        && pathStr.substr(0, NODE_MODULES_DIR.length) !== NODE_MODULES_DIR
        && pathStr.substr(0, VENDOR_DIR.length) !== VENDOR_DIR
        && pathStr.substr(0, WEBSITE_DIR.length) !== WEBSITE_DIR
        && path.extname(pathStr) === '.js'
      );
    }
  });

  finder.on('error', function(err) {
    console.error('Error: ' + (err.stack || err.msg || err));
    process.exit(1);
  });

  finder.on('match', function(pathStr) {
    console.log('Reading ' + pathStr + '...');
    fs.readFile(pathStr, 'utf8', function(err, fileData) {
      if (err) {
        throw err;
      }

      if (needsLicenseHeader(fileData)) {
        console.log('Adding license header to ' + pathStr + '...');
        addLicenseHeader(fileData);
        fs.writeFile(pathStr, addLicenseHeader(fileData), function(err) {
          if (err) {
            throw err;
          }
          console.log('Successfully updated ' + pathStr + '!');
        });
      }
    });
  });

  finder.startSearch();
}

if (require.main === module) {
  main();
}
