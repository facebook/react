// @enableInstructionReordering

function Component(props) {
  const x = [];
  const a = props.a;
  x.push(props.a);
  const b = a.b;
  x.push(props.b);
  const c = b.c;
  x.push(props.c);
  const d = c.d;
  x.push(props.d);
  return [d, x];
}
