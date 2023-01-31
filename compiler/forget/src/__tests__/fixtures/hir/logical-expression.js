function component(props) {
  let a = props.a && props.b;
  return a;
  // let b = props.c || props.d;
  // let c = props.e ?? props.f;
  // return ((a && b) || c) ?? null;
}
