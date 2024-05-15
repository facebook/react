function component(a) {
  let t = { a };
  function x() {
    t.foo();
  }
  x(t);
  return t;
}
