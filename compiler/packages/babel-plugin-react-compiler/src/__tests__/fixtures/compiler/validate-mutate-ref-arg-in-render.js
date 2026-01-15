// @validateRefAccessDuringRender:true

function Foo(props, ref) {
  // Allowed: the value is not guaranteed to flow into something that's rendered
  console.log(ref.current);
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{bar: 'foo'}, {ref: {cuurrent: 1}}],
  isComponent: true,
};
