function Component(props) {
  const { x: { y } = { y: "default" } } = props.y;
  return y;
}
