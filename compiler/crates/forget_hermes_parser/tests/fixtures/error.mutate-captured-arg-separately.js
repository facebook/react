// Let's not support identifiers defined after use for now.
function component(a) {
  let y = function () {
    m(x);
  };

  let x = { a };
  m(x);
  return y;
}
