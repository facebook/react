function Test() {
  const obj = {
    21: 'dimaMachina'
  }
  return <div>{obj[21]}</div>
}

export const FIXTURE_ENTRYPOINT = {
  fn: Test,
  params: [{}],
};
