function bar(a) {
  let x = [a];
  let y = {};
  (function () {
    y = x[0][1];
  })();

  return y;
}
