function Component(props) {
  let x;
  if (props.cond) {
    [[x] = ["default"]] = props.y;
  } else {
    x = props.fallback;
  }
  return x;
}
