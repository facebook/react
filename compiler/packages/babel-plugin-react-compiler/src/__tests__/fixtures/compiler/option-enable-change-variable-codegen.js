// @enableChangeVariableCodegen
function Component(props) {
  const c_0 = [props.a, props.b.c];
  return c_0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 3.14, b: {c: true}}],
};
