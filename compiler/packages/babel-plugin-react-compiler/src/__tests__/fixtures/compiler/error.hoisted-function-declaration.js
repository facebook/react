function component(a) {
  let t = {a};
  x(t); // hoisted call
  function x(p) {
    p.foo();
  }
  return t;
}
