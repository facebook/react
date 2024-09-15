function component(a) {
  let z = { a: { a } };
  let x = function () {
    console.log(z.a.a);
  };
  return x;
}
