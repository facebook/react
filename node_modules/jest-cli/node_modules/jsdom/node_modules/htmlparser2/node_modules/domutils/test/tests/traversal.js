var makeDom = require("../utils").makeDom;
var traversal = require("../..");
var assert = require("assert");

describe("traversal", function() {
  describe("hasAttrib", function() {
    var hasAttrib = traversal.hasAttrib;

    it("doesn't throw on text nodes", function() {
      var dom = makeDom("textnode");
      assert.doesNotThrow(function() {
        hasAttrib(dom[0], "some-attrib");
      });
    });

  });
});
