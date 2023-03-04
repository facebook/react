function foo(props) {
  const [x, y, ...z] = props.a;
  return x + y;
}
