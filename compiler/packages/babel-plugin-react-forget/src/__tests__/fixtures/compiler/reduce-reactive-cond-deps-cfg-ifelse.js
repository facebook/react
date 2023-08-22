// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInDirectIfElse(props, other) {
  const x = {};
  if (foo(other)) {
    x.b = props.a.b;
  } else {
    x.c = props.a.b;
  }
  return x;
}
