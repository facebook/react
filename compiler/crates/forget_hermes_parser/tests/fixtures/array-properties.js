function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.length;
  const y = a.push;
  return { a, x, y, z: a.concat };
}
