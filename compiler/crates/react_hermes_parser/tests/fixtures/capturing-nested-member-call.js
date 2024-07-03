function component(a) {
  let z = { a: { a } };
  let x = function () {
    z.a.a();
  };
  return z;
}
