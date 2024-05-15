function Component(props) {
  bar;
  bar = true;
  baz;
  baz = false;
  function foo() {
    bar;
    bar = true;
    if (props) {
      var bar;
    }
  }
  if (props) {
    // nest inside a block statement to test that the declaration hoists
    var bar;
  }
}

var baz;
