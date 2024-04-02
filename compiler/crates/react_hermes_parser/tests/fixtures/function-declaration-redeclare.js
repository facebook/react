function component() {
  function x(a) {
    a.foo();
  }
  function x() {}
  return x;
}
