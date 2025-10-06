// @validateRefAccessDuringRender:true
function Foo(props, ref) {
  console.log(ref.current);
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{bar: 'foo'}, {ref: {current: 1}}],
  isComponent: true,
};
