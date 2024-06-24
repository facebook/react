function useFoo(a, b, c) {
  let x = {};
  write(x, a);

  const y = [];
  if (x.a != null) {
    y.push(x.a.b);
  }
  y.push(b);

  x = makeThing();
  write(x.a.b);

  return [y, x.a.b];
}
