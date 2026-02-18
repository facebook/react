function process(a, b) {}
function Component(props) {
  const a = {};
  const b = {};
  if (props.skip) {
    return null;
  }
  process(a, b);
  return <div />;
}

function Symbol() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{skip: true}],
};
