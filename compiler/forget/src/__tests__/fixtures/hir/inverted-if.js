function foo(a, b, c) {
  let y = [];
  label: if (a) {
    if (b) {
      y.push(c);
      break label;
    }
  }
}
