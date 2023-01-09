function component() {
  let z = 100;
  let x;
  {
    x = function () {
      z;
    };
  }
  return x;
}
