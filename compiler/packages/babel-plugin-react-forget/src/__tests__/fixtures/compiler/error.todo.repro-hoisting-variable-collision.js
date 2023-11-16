function Component(props) {
  const items = props.items.map((x) => x);
  const x = 42;
  return [x, items];
}
