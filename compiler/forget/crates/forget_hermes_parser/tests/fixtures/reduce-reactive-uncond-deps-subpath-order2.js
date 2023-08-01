// Determine that we only need to track p.a here
// Ordering of access should not matter
function TestDepsSubpathOrder2(props) {
  let x = {};
  x.a = props.a;
  x.b = props.a.b;
  x.c = props.a.b.c;
  return x;
}
