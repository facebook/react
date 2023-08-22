function component(a) {
  let x = { a };
  let y = {};
  (function () {
    y = x;
  })();
  mutate(y);
  return y;
}
