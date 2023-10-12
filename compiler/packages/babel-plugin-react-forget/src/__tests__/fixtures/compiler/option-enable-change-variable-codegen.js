// @enableChangeVariableCodegen
function Component(props) {
  const x = [props.a, props.b.c];
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 3.14, b: { c: true } }],
};
