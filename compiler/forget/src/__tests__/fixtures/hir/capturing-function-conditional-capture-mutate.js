function component(a, b) {
  let z = { a };
  let y = b;
  let x = function () {
    if (y) {
      mutate(z);
    }
  };
  return x;
}
