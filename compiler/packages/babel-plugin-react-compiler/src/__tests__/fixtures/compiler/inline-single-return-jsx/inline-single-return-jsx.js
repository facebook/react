// @enableInlineSingleReturnJSX @compilationMode(infer)

function Child({value, children}) {
  'use no forget';
  return (
    <div>
      <span>{value}</span>
      {children}
    </div>
  );
}

function Component({a, b}) {
  return (
    <Child value={a}>
      <div>{b}</div>
    </Child>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 1, b: 0},
    {a: 1, b: 1},
    {a: 0, b: 1},
    {a: 0, b: 0},
    {a: 1, b: 1},
  ],
};
