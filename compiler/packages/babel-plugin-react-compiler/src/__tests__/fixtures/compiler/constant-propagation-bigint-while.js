function foo() {
  let x = 100n;
  let y = 0n;
  while (x < 10n) {
    y += 1n;
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};
