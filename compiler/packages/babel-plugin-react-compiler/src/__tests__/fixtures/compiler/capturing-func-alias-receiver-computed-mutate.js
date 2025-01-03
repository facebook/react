function component(a) {
  let x = {a};
  let y = {};
  const f0 = function () {
    let a = y;
    a['x'] = x;
  };
  f0();
  mutate(y);
  return y;
}
