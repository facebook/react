const { ObjectWithHooks } = require("shared-runtime");

function Component(props) {
  const x = [];
  const [y] = ObjectWithHooks.useFoo();
  x.push(y);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
