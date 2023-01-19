function component(a) {
  let z = { a };
  let x = function () {
    z.a;
  };
  return x;
}
