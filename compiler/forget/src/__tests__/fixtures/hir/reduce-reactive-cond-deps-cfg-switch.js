// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInSwitch(props, other) {
  const x = {};
  switch (foo(other)) {
    case 1:
      x.a = props.a.b;
      break;
    case 2:
      x.b = props.a.b;
      break;
    default:
      x.c = props.a.b;
  }
  return x;
}
