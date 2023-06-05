function Component(props) {
  const [[x] = ["default"]] = props.y;
  return x;
}
