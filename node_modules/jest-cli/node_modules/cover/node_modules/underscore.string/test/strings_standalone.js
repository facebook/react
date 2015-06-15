$(document).ready(function() {

  module("String extensions");

  test("underscore not included", function() {
    raises(function() { _("foo") }, /TypeError/);
  });

  test("provides standalone functions", function() {
    equals(typeof _.str.trim, "function");
  });
});
