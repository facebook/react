// @enableEmitFreeze true

function MyComponentName(props) {
  let x = {};
  foo(x, props.a);
  foo(x, props.b);

  let y = [];
  y.push(x);
  return y;
}
