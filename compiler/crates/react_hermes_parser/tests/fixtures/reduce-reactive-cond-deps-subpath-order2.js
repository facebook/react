// When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath2(props, other) {
  const x = {};
  if (foo(other)) {
    x.a = props.a;
  }
  x.b = props.a.b;
  return x;
}
