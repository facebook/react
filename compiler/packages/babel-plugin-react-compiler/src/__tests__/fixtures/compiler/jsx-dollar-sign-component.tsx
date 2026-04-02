// Regression test: when a function is named `$`, the compiler should not
// use `$` as the name for its synthesized memo cache variable — that would
// shadow the function name. The memo cache should be renamed to $0 (or similar).
// See https://github.com/facebook/react/issues/36167

function $(n: number) {
  return n * 2;
}

function Component({x}: {x: number}) {
  return <div>{$(x)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 5}],
};
