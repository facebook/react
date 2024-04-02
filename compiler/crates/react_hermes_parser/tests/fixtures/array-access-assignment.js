function foo(a, b, c) {
  const x = [a];
  const y = [null, b];
  const z = [[], [], [c]];
  x[0] = y[1];
  z[0][0] = x[0];
  return [x, z];
}
