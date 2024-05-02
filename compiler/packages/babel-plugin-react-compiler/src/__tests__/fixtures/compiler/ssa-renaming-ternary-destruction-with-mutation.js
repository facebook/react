function foo(props) {
  let x = [];
  x.push(props.bar);
  props.cond ? (({ x } = { x: {} }), ([x] = [[]]), x.push(props.foo)) : null;
  mut(x);
  return x;
}
