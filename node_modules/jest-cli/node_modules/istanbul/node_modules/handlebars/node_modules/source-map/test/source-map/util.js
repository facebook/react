/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('../../lib/source-map/util');

  // This is a test mapping which maps functions from two different files
  // (one.js and two.js) to a minified generated source.
  //
  // Here is one.js:
  //
  //   ONE.foo = function (bar) {
  //     return baz(bar);
  //   };
  //
  // Here is two.js:
  //
  //   TWO.inc = function (n) {
  //     return n + 1;
  //   };
  //
  // And here is the generated code (min.js):
  //
  //   ONE.foo=function(a){return baz(a);};
  //   TWO.inc=function(a){return a+1;};
  exports.testGeneratedCode = " ONE.foo=function(a){return baz(a);};\n"+
                              " TWO.inc=function(a){return a+1;};";
  exports.testMap = {
    version: 3,
    file: 'min.js',
    names: ['bar', 'baz', 'n'],
    sources: ['one.js', 'two.js'],
    sourceRoot: '/the/root',
    mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA'
  };
  exports.testMapNoSourceRoot = {
    version: 3,
    file: 'min.js',
    names: ['bar', 'baz', 'n'],
    sources: ['one.js', 'two.js'],
    mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA'
  };
  exports.testMapEmptySourceRoot = {
    version: 3,
    file: 'min.js',
    names: ['bar', 'baz', 'n'],
    sources: ['one.js', 'two.js'],
    sourceRoot: '',
    mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA'
  };
  exports.testMapWithSourcesContent = {
    version: 3,
    file: 'min.js',
    names: ['bar', 'baz', 'n'],
    sources: ['one.js', 'two.js'],
    sourcesContent: [
      ' ONE.foo = function (bar) {\n' +
      '   return baz(bar);\n' +
      ' };',
      ' TWO.inc = function (n) {\n' +
      '   return n + 1;\n' +
      ' };'
    ],
    sourceRoot: '/the/root',
    mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA'
  };
  exports.testMapRelativeSources = {
    version: 3,
    file: 'min.js',
    names: ['bar', 'baz', 'n'],
    sources: ['./one.js', './two.js'],
    sourcesContent: [
      ' ONE.foo = function (bar) {\n' +
      '   return baz(bar);\n' +
      ' };',
      ' TWO.inc = function (n) {\n' +
      '   return n + 1;\n' +
      ' };'
    ],
    sourceRoot: '/the/root',
    mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA'
  };
  exports.emptyMap = {
    version: 3,
    file: 'min.js',
    names: [],
    sources: [],
    mappings: ''
  };


  function assertMapping(generatedLine, generatedColumn, originalSource,
                         originalLine, originalColumn, name, map, assert,
                         dontTestGenerated, dontTestOriginal) {
    if (!dontTestOriginal) {
      var origMapping = map.originalPositionFor({
        line: generatedLine,
        column: generatedColumn
      });
      assert.equal(origMapping.name, name,
                   'Incorrect name, expected ' + JSON.stringify(name)
                   + ', got ' + JSON.stringify(origMapping.name));
      assert.equal(origMapping.line, originalLine,
                   'Incorrect line, expected ' + JSON.stringify(originalLine)
                   + ', got ' + JSON.stringify(origMapping.line));
      assert.equal(origMapping.column, originalColumn,
                   'Incorrect column, expected ' + JSON.stringify(originalColumn)
                   + ', got ' + JSON.stringify(origMapping.column));

      var expectedSource;

      if (originalSource && map.sourceRoot && originalSource.indexOf(map.sourceRoot) === 0) {
        expectedSource = originalSource;
      } else if (originalSource) {
        expectedSource = map.sourceRoot
          ? util.join(map.sourceRoot, originalSource)
          : originalSource;
      } else {
        expectedSource = null;
      }

      assert.equal(origMapping.source, expectedSource,
                   'Incorrect source, expected ' + JSON.stringify(expectedSource)
                   + ', got ' + JSON.stringify(origMapping.source));
    }

    if (!dontTestGenerated) {
      var genMapping = map.generatedPositionFor({
        source: originalSource,
        line: originalLine,
        column: originalColumn
      });
      assert.equal(genMapping.line, generatedLine,
                   'Incorrect line, expected ' + JSON.stringify(generatedLine)
                   + ', got ' + JSON.stringify(genMapping.line));
      assert.equal(genMapping.column, generatedColumn,
                   'Incorrect column, expected ' + JSON.stringify(generatedColumn)
                   + ', got ' + JSON.stringify(genMapping.column));
    }
  }
  exports.assertMapping = assertMapping;

  function assertEqualMaps(assert, actualMap, expectedMap) {
    assert.equal(actualMap.version, expectedMap.version, "version mismatch");
    assert.equal(actualMap.file, expectedMap.file, "file mismatch");
    assert.equal(actualMap.names.length,
                 expectedMap.names.length,
                 "names length mismatch: " +
                   actualMap.names.join(", ") + " != " + expectedMap.names.join(", "));
    for (var i = 0; i < actualMap.names.length; i++) {
      assert.equal(actualMap.names[i],
                   expectedMap.names[i],
                   "names[" + i + "] mismatch: " +
                     actualMap.names.join(", ") + " != " + expectedMap.names.join(", "));
    }
    assert.equal(actualMap.sources.length,
                 expectedMap.sources.length,
                 "sources length mismatch: " +
                   actualMap.sources.join(", ") + " != " + expectedMap.sources.join(", "));
    for (var i = 0; i < actualMap.sources.length; i++) {
      assert.equal(actualMap.sources[i],
                   expectedMap.sources[i],
                   "sources[" + i + "] length mismatch: " +
                   actualMap.sources.join(", ") + " != " + expectedMap.sources.join(", "));
    }
    assert.equal(actualMap.sourceRoot,
                 expectedMap.sourceRoot,
                 "sourceRoot mismatch: " +
                   actualMap.sourceRoot + " != " + expectedMap.sourceRoot);
    assert.equal(actualMap.mappings, expectedMap.mappings,
                 "mappings mismatch:\nActual:   " + actualMap.mappings + "\nExpected: " + expectedMap.mappings);
    if (actualMap.sourcesContent) {
      assert.equal(actualMap.sourcesContent.length,
                   expectedMap.sourcesContent.length,
                   "sourcesContent length mismatch");
      for (var i = 0; i < actualMap.sourcesContent.length; i++) {
        assert.equal(actualMap.sourcesContent[i],
                     expectedMap.sourcesContent[i],
                     "sourcesContent[" + i + "] mismatch");
      }
    }
  }
  exports.assertEqualMaps = assertEqualMaps;

});
