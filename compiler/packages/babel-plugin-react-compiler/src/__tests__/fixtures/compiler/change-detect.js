// @enableChangeDetectionForDebugging
let glob = 1;

function Component(props) {
  const a = props.x;
  const { b, ...c } = props.y;
  const d = glob;
  return (
    <div>
      {a}
      {b}
      {c.c}
      {d}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1, y: { b: 2, c: 3, d: 4 } }],
  isComponent: true,
};
