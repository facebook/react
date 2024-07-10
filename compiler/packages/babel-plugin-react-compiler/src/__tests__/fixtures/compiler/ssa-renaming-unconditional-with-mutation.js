function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  } else {
    x = [];
    x = [];
    x.push(props.bar);
  }
  mut(x);
  return x;
}
