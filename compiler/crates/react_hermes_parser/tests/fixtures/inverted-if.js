function foo(a, b, c, d) {
  let y = [];
  label: if (a) {
    if (b) {
      y.push(c);
      break label;
    }
    y.push(d);
  }
  return y;
}
