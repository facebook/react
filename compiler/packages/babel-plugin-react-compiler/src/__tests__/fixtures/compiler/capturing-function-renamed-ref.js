function component(a, b) {
  let z = {a};
  {
    let z = {b};
    (function () {
      mutate(z);
    })();
  }
  return z;
}
