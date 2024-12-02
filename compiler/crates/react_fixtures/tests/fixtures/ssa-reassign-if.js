function Component(a, b) {
  let x;
  let y = 0;
  let z = 10;
  if (a) {
    x = 1;
    if (b) {
      z = 20;
    } else {
      z = 30;
    }
  } else {
    x = 2;
  }
  return x + y + z;
}
