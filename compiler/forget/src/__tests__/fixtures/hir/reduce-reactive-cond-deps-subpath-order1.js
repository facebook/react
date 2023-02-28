// When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath1(props, other) {
  const x = {};
  x.b = props.a.b;
  if (foo(other)) {
    x.a = props.a;
  }
  return x;
}
