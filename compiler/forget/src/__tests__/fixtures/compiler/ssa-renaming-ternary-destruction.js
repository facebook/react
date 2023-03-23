function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? (({ x } = { x: {} }), ([x] = [[]]), x.push(props.foo))
    : null;
  console.log(_);
  return x;
}
