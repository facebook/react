// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const value = props.value;
  foo(ref, value);
  return <div></div>;
}
