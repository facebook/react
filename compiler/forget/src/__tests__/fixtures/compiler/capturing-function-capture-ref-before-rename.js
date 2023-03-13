function component(a, b) {
  let z = { a };
  (function () {
    mutate(z);
  })();
  let y = z;

  {
    // z is shadowed & renamed but the lambda is unaffected.
    let z = { b };
    y = { y, z };
  }
  return y;
}
