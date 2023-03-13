function component(a) {
  let z = { a: { a } };
  let x = function () {
    (function () {
      z.a.a;
    })();
  };
  return x;
}
