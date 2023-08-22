function component(a) {
  let z = { a };
  let x = function () {
    console.log(z);
  };
  return x;
}
