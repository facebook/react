function foo(a, b, c) {
  const x = { ...a };
  x[b] = c[b];
  x[1 + 2] = c[b * 4];
}
