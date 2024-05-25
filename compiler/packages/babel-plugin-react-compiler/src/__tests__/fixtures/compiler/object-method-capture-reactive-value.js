function Component(props) {
  let value;
  const object = {
    setValue(v) {
      value = v;
    },
  };
  object.setValue(props.value);
  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 0 }],
  sequentialRenders: [{ value: 1 }, { value: 2 }],
};
