function Component() {
  let a = 0;
  const b = a++;
  const c = ++a;
  const d = a--;
  const e = --a;
  return { a, b, c, d, e };
}
