// @enableReactiveGraph
function Component(props) {
  let element = props.default;
  let other = element;
  if (props.cond) {
    element = <div></div>;
  } else {
    element = <span></span>;
  }
  return [element, other];
}
