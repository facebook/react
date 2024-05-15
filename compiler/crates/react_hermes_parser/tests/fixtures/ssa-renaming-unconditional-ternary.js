function foo(props) {
  let x = [];
  x.push(props.bar);
  props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  return x;
}
