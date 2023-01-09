function foo(a) {
  let x = 0;
  bar: {
    x = 1;
    break bar;
  }
  return a + x;
}
