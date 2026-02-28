const computedPropKey = 'foobar';

function Component(props) {
  const obj = {
    [computedPropKey]() {
      return props.value;
    },
  };
  return obj[computedPropKey]();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};
