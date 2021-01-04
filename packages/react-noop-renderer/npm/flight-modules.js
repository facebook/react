'use strict';

// This file is used as temporary storage for modules generated in Flight tests.
var moduleIdx = 0;
var modules = new Map();

// This simulates what the compiler will do when it replaces render functions with server blocks.
exports.saveModule = function saveModule(render) {
  var idx = '' + moduleIdx++;
  modules.set(idx, render);
  return idx;
};

exports.readModule = function readModule(idx) {
  return modules.get(idx);
};
