function component(a) {
  let x = { a };
  let y = 1;
  (function () {
    y = x;
  })();
  mutate(y);
  return y;
}
