function Component(props) {
  let x;
  if (props.cond) {
    [[x] = [foo()]] = props.y;
  } else {
    x = props.fallback;
  }
  return x;
}
