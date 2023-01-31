// @skip
function sequence(props) {
  let x = (null, Math.max(1, 2), sequence({}));
  if (((x = x + 1), x < 10)) {
    x = 10;
  }
  x = ((x = x + 1), x > 15) && x < 20 ? ((x = x + 1), x) : 42;
  while (((x = x * 2), x < 20)) {
    x = ((x = x + 1), x + 1);
  }
  return x;
}
