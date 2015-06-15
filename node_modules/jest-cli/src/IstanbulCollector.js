/**
* Copyright (c) 2014, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

var istanbul = require('istanbul');

function IstanbulCollector(sourceText, filename) {
  var instr = new istanbul.Instrumenter();
  this._coverageDataStore = {};
  this._instrumentor = instr;
  this._origSourceText = sourceText;
  this._instrumentedSourceText = instr.instrumentSync(sourceText, filename);
}

IstanbulCollector.prototype.getCoverageDataStore = function() {
  return this._coverageDataStore;
};

IstanbulCollector.prototype.getInstrumentedSource = function(storageVarName) {
  return this._instrumentedSourceText + storageVarName + '.coverState=' +
         this._instrumentor.currentState.trackerVar + ';';
};

IstanbulCollector.prototype.extractRuntimeCoverageInfo = function() {
  return this._coverageDataStore.coverState;
};

module.exports = IstanbulCollector;
