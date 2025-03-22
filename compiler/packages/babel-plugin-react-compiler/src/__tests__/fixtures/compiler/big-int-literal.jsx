function Test(props) {
  if (props.num % 2n === 0n) {
    return <>even</>;
  }

  return <>odd</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Test,
  params: [{num: 1n}],
};
