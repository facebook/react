// @enableInlineSingleReturnJSX
function Component({a, b}) {
  return (
    <Child value={a}>
      <div>{b}</div>
    </Child>
  );
}

function Child({value, children}) {
  return (
    <div>
      <span>{value}</span>
      {children}
    </div>
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
