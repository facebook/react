// @enableReactiveGraph
function Component(props) {
  let element = props.default;
  let other = element;
  label: if (props.cond) {
    if (props.ret) {
      break label;
    } else {
      element = <div></div>;
    }
  } else {
    element = <span></span>;
  }
  return [element, other];
}
