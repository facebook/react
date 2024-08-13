function component(a) {
  let z = {a};
  let x = function () {
    let z;
    mutate(z);
  };
  return x;
}
