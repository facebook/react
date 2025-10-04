// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  foo(ref);
  return <div></div>;
}
