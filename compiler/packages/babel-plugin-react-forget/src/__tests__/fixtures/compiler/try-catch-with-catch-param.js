function Component(props) {
  let x = [];
  try {
    // foo could throw its argument...
    foo(x);
  } catch (e) {
    // ... in which case this could be mutating `x`!
    e.push(null);
    return e;
  }
  return x;
}
