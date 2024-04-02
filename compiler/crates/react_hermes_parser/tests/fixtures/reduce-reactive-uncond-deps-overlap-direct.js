// Test that we correctly track a subpath if the subpath itself is accessed as
// a dependency
function TestOverlappingTracked(props) {
  let x = {};
  x.b = props.a.b;
  x.c = props.a.c;
  x.a = props.a;
  return x;
}
