// props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in every path

function TestCondDepInNestedIfElse(props, other) {
  const x = {};
  if (foo(other)) {
    if (bar()) {
      x.a = props.a.b;
    }
  } else {
    x.d = props.a.b;
  }
  return x;
}
