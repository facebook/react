// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath1(props, other) {
  const x = {};
  x.a = props.a;
  if (foo(other)) {
    x.b = props.a.b;
  }
  return x;
}
