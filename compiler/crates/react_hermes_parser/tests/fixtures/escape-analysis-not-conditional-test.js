function Component(props) {
  const x = [props.a];
  const y = x ? props.b : props.c;
  return y;
}
