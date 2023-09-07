function Component(props) {
  const x = [];
  try {
    x.push(foo());
  } catch {
    x.push(bar());
  }
  x.push(props.value); // extend the mutable range to include the try/catch
  return x;
}
