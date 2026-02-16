class Symbol {}
function mutate() {}
function foo(cond) {
  let a = {};
  let b = {};
  let c = {};
  a = b;
  b = c;
  if (cond) {
    c = a;
  } else {
    return a;
  }
  mutate(a, b);
  return c;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [true],
};
