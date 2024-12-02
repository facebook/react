// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath2(props, other) {
  const x = {};
  if (foo(other)) {
    x.b = props.a.b;
  }
  x.a = props.a;
  return x;
}
