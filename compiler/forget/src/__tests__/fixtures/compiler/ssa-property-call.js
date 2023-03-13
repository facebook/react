function foo() {
  const x = [];
  const y = { x: x };
  y.x.push([]);
  return y;
}
