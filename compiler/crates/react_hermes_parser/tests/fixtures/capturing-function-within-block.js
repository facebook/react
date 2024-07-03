function component(a) {
  let z = { a };
  let x;
  {
    x = function () {
      console.log(z);
    };
  }
  return x;
}
