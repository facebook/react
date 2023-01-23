function component(a) {
  let y = function () {
    m(x);
  };

  let x = { a };
  m(x);
  return y;
}
