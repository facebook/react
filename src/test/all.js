// This file exists both to give a single entry point for all the utility
// modules in src/test and to specify an ordering on those modules, since
// some still have implicit dependencies on others.

require("./phantomjs-shims");
require("ReactTestUtils");
require("reactComponentExpect");
require("mocks");
require("mock-modules");
require("./mock-timers");

exports.enableTest = function(testID) {
  require("../" + testID);
};

exports.removeNextSiblings = function(node) {
  var parent = node && node.parentNode;
  if (parent) {
    while (node.nextSibling) {
      parent.removeChild(node.nextSibling);
    }
  }
};
