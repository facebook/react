function component(a) {
  let x = {a};
  let y = {};
  const f0 = function () {
    y = x;
  };
  f0();
  mutate(y);
  return y;
}
