function foo() {
  let x = {};
  let y = [];
  let z = {};
  y.push(z);
  x.y = y;

  return x;
}
