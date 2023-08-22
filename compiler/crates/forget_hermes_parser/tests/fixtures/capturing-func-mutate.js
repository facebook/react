function component(a, b) {
  let z = { a };
  let y = { b };
  let x = function () {
    z.a = 2;
    console.log(y.b);
  };
  x();
  return z;
}
