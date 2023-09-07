function Component(props) {
  const x = [];
  try {
    x.push(foo());
  } catch {
    x.push(bar());
  }
  return x;
}
