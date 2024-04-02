function Foo(props) {
  const { x, y, ...z } = props.a;
  return x;
}
