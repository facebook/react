function component(a) {
  let x = { a };
  (function () {
    let q = x;
    (function () {
      q.b = 1;
    })();
  })();

  return x;
}
