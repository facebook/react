// @debug
function Component(a, [b], { c }) {
  let d = a++;
  let e = ++a;
  let f = b--;
  let g = --b;
  let h = c++;
  let i = --c;
  return [a, b, c, d, e, f, g, h, i];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [2, [3], { c: 4 }],
  isComponent: false,
};
