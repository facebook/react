function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }
  throw x;
}
