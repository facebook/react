function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  console.log(_);
  return x;
}
