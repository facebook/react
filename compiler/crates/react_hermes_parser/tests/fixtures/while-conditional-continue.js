function foo(a, b, c, d) {
  while (a) {
    if (b) {
      continue;
    }
    c();
    continue;
  }
  d();
}
