// @skip
// TODO(gsn): This doesn't seem to work correctly. Need to debug more.
function component(a) {
  let y = { b: { a } };
  let x = function () {
    y.b.a = 2;
  };
  x();
  return x;
}
