// @enableReactiveGraph
function Component(props) {
  const x = [];
  const y = [];
  if (props.condition) {
    x.push(props.x);
  }
  y.push(props.y);
  return [x, y];
}
