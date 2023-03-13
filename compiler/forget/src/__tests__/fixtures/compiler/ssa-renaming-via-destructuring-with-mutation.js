function foo(props) {
  let { x } = { x: [] };
  x.push(props.bar);
  if (props.cond) {
    ({ x } = { x: {} });
    ({ x } = { x: [] });
    x.push(props.foo);
  }
  mut(x);
  return x;
}
