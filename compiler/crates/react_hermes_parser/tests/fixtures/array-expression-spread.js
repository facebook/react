function Component(props) {
  const x = [0, ...props.foo, null, ...props.bar, "z"];
  return x;
}
