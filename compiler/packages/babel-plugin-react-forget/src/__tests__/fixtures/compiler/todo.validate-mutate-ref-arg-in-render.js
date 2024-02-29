// @validateRefAccessDuringRender: true
function Foo(props, ref) {
  ref.current = 2;
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ bar: "foo" }, { ref: { cuurrent: 1 } }],
  isComponent: true,
};
