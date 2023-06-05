function Component(props) {
  const x = { a: props.a, b: props.b };
  delete x.b;
  return x;
}
