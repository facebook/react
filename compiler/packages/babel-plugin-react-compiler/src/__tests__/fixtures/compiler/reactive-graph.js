// @enableReactiveGraph
function Component(props) {
  const elements = [];
  if (props.value) {
    elements.push(<div>{props.value}</div>);
  }
  return elements;
}
