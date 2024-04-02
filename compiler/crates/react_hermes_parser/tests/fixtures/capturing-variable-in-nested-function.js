function component(a) {
  let z = { a };
  let x = function () {
    (function () {
      console.log(z);
    })();
  };
  return x;
}
