function foo(props) {
  const [x, unused, y] = props.a;
  return x + y;
}
