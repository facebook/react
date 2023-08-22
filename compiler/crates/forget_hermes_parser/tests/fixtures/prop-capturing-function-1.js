function component(a, b) {
  let z = { a, b };
  let x = function () {
    console.log(z);
  };
  return x;
}
