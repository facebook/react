function Component(props) {
  const [[x] = [foo()]] = props.y;
  return x;
}
