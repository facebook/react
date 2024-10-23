// @enableTreatFunctionDepsAsConditional
function Component(props) {
  function getLength() {
    return props.bar.length;
  }

  return props.bar && getLength();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{bar: null}],
};
