function foo(a, b, c) {
  a[b] = c[b];
  a[1 + 2] = c[b * 4];
}
