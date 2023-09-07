function Component(props) {
  let x;
  try {
    x = foo();
  } catch {
    x = null;
  }
  return x;
}
