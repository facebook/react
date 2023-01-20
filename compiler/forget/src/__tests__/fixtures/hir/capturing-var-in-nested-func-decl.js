// @skip -- TODO: support lowering Function Declaration in HIR
function component(a) {
  let z = { a };
  let x = function () {
    function t() {
      z;
    }
    t();
  };
  return x;
}
