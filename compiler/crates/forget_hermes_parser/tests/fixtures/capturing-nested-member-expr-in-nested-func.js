function component(a) {
  let z = { a: { a } };
  let x = function () {
    (function () {
      console.log(z.a.a);
    })();
  };
  return x;
}
