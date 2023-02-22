function component(a) {
  let x = { a };
  let y = {};
  (function () {
    y["x"] = x;
  })();
  mutate(y);
  return y;
}
