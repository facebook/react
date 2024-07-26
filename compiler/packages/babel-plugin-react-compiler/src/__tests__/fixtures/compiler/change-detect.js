// @enableChangeDetection
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
