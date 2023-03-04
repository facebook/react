function foo(props) {
  let x, y;
  ({ x, y } = { x: props.a, y: props.b });
  x = props.c;
  return x + y;
}
