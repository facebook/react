// props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in every path

function TestCondDepInSwitchMissingCase(props, other) {
  const x = {};
  switch (foo(other)) {
    case 1:
      x.a = props.a.b;
      break;
    case 2:
      x.b = 42;
      break;
    default:
      x.c = props.a.b;
      break;
  }
  return x;
}
