function Component(props) {
  const index = "foo";
  const x = {};
  x[index] = x[index] + x["bar"];
  x[index](props.foo);
  return x;
}
