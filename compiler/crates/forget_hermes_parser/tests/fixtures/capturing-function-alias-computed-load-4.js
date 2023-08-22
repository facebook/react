function bar(a) {
  let x = [a];
  let y = {};
  (function () {
    y = x[0].a[1];
  })();

  return y;
}
