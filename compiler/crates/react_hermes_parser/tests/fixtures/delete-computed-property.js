function Component(props) {
  const x = { a: props.a, b: props.b };
  const key = "b";
  delete x[key];
  return x;
}
