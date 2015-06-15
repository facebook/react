/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
var path = require('path');
var fs = require('fs');
var copy = require('dryice').copy;

function removeAmdefine(src) {
  src = String(src).replace(
    /if\s*\(typeof\s*define\s*!==\s*'function'\)\s*{\s*var\s*define\s*=\s*require\('amdefine'\)\(module,\s*require\);\s*}\s*/g,
    '');
  src = src.replace(
    /\b(define\(.*)('amdefine',?)/gm,
    '$1');
  return src;
}
removeAmdefine.onRead = true;

function makeNonRelative(src) {
  return src
    .replace(/require\('.\//g, 'require(\'source-map/')
    .replace(/\.\.\/\.\.\/lib\//g, '');
}
makeNonRelative.onRead = true;

function buildBrowser() {
  console.log('\nCreating dist/source-map.js');

  var project = copy.createCommonJsProject({
    roots: [ path.join(__dirname, 'lib') ]
  });

  copy({
    source: [
      'build/mini-require.js',
      {
        project: project,
        require: [ 'source-map/source-map-generator',
                   'source-map/source-map-consumer',
                   'source-map/source-node']
      },
      'build/suffix-browser.js'
    ],
    filter: [
      copy.filter.moduleDefines,
      removeAmdefine
    ],
    dest: 'dist/source-map.js'
  });
}

function buildBrowserMin() {
  console.log('\nCreating dist/source-map.min.js');

  copy({
    source: 'dist/source-map.js',
    filter: copy.filter.uglifyjs,
    dest: 'dist/source-map.min.js'
  });
}

function buildFirefox() {
  console.log('\nCreating dist/SourceMap.jsm');

  var project = copy.createCommonJsProject({
    roots: [ path.join(__dirname, 'lib') ]
  });

  copy({
    source: [
      'build/prefix-source-map.jsm',
      {
        project: project,
        require: [ 'source-map/source-map-consumer',
                   'source-map/source-map-generator',
                   'source-map/source-node' ]
      },
      'build/suffix-source-map.jsm'
    ],
    filter: [
      copy.filter.moduleDefines,
      removeAmdefine,
      makeNonRelative
    ],
    dest: 'dist/SourceMap.jsm'
  });

  // Create dist/test/Utils.jsm
  console.log('\nCreating dist/test/Utils.jsm');

  project = copy.createCommonJsProject({
    roots: [ __dirname, path.join(__dirname, 'lib') ]
  });

  copy({
    source: [
      'build/prefix-utils.jsm',
      'build/assert-shim.js',
      {
        project: project,
        require: [ 'test/source-map/util' ]
      },
      'build/suffix-utils.jsm'
    ],
    filter: [
      copy.filter.moduleDefines,
      removeAmdefine,
      makeNonRelative
    ],
    dest: 'dist/test/Utils.jsm'
  });

  function isTestFile(f) {
    return /^test\-.*?\.js/.test(f);
  }

  var testFiles = fs.readdirSync(path.join(__dirname, 'test', 'source-map')).filter(isTestFile);

  testFiles.forEach(function (testFile) {
    console.log('\nCreating', path.join('dist', 'test', testFile.replace(/\-/g, '_')));

    copy({
      source: [
        'build/test-prefix.js',
        path.join('test', 'source-map', testFile),
        'build/test-suffix.js'
      ],
      filter: [
        removeAmdefine,
        makeNonRelative,
        function (input, source) {
          return input.replace('define(',
                               'define("'
                               + path.join('test', 'source-map', testFile.replace(/\.js$/, ''))
                               + '", ["require", "exports", "module"], ');
        },
        function (input, source) {
          return input.replace('{THIS_MODULE}', function () {
            return "test/source-map/" + testFile.replace(/\.js$/, '');
          });
        }
      ],
      dest: path.join('dist', 'test', testFile.replace(/\-/g, '_'))
    });
  });
}

function ensureDir(name) {
  var dirExists = false;
  try {
    dirExists = fs.statSync(name).isDirectory();
  } catch (err) {}

  if (!dirExists) {
    fs.mkdirSync(name, 0777);
  }
}

ensureDir("dist");
ensureDir("dist/test");
buildFirefox();
buildBrowser();
buildBrowserMin();
