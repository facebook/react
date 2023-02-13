let someGlobal = {};
function component(a) {
  let x = { a, someGlobal };
  return x;
}
