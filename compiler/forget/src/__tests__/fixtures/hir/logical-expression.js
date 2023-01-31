// @only
function component(props) {
  let a = (props.a && props.b && props.c) || props.d;
  return a;
  // let b = props.c || props.d;
  // let c = props.e ?? props.f;
  // return ((a && b) || c) ?? null;
}
