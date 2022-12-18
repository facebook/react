function foo(a, b, c) {
  const x = { a: a };
  // TODO @josephsavona: this array *should* be memoized independently from `x`,
  // similar to the behavior if we extract into a variable as with `z` below:
  x.y = [b, c];

  const y = { a: a };
  // this array correctly memoizes independently
  const z = [b, c];
  y.y = z;

  return [x, y];
}
