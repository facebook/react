// bar(props.b) is an allocating expression that produces a primitive, which means
// that Forget should memoize it.
// Correctness:
//   - y depends on either bar(props.b) or bar(props.b) + 1
function AllocatingPrimitiveAsDepNested(props) {
  let x = {};
  mutate(x);
  let y = foo(bar(props.b) + 1);
  mutate(x, props.a);
  return [x, y];
}
