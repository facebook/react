function component(a) {
  let t = { a };
  function x(p) {
    p.foo();
  }
  x(t);
  return t;
}
