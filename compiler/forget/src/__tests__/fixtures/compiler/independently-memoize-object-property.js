function foo(a, b, c) {
  const x = { a: a };
  // NOTE: this array should memoize independently from x, w only b,c as deps
  x.y = [b, c];

  return x;
}
