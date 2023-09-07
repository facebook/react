// @debug
function Component(props) {
  let x = [];
  try {
    const y = foo();
    if (y == null) {
      return;
    }
    x.push(bar(y));
  } catch {
    return null;
  }
  return x;
}
