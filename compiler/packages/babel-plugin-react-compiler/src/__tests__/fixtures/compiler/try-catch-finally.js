function Component(props) {
  try {
    if (props.cond) {
      return 1;
    }
    return 2;
  } catch (e) {
    return 3;
  } finally {
    console.log('cleanup');
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: true}],
  sequentialRenders: [
    {cond: true},
    {cond: false},
  ],
};
