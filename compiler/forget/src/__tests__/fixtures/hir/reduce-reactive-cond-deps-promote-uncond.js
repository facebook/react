// When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access
// and promote it to an unconditional dependency.
function TestPromoteUnconditionalAccessToDependency(props, other) {
  const x = {};
  x.a = props.a.a.a;
  if (foo(other)) {
    x.c = props.a.b.c;
  }
  return x;
}
