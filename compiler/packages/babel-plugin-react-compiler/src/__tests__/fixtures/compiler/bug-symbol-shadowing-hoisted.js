function mutate() {}
function foo(cond) {
  let a = {};
  let b = {};
  let c = {};
  a = b;
  b = c;
  c = a;
  mutate(a, b);
  return c;
}

function Symbol() {}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [true],
};
