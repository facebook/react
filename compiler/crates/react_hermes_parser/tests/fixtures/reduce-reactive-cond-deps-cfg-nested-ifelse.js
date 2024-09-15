// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInNestedIfElse(props, other) {
  const x = {};
  if (foo(other)) {
    if (bar()) {
      x.a = props.a.b;
    } else {
      x.b = props.a.b;
    }
  } else if (baz(other)) {
    x.c = props.a.b;
  } else {
    x.d = props.a.b;
  }
  return x;
}
