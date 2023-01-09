function component() {
  let z = 100;
  let x = function () {
    (function () {
      z;
    })();
  };
  return x;
}
