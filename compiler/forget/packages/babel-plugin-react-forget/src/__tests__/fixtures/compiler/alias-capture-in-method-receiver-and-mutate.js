function Component() {
  // a's mutable range should be the same as x's mutable range,
  // since a is captured into x (which gets mutated later)
  let a = someObj();

  let x = [];
  x.push(a);

  mutate(x);
  return [x, a];
}
