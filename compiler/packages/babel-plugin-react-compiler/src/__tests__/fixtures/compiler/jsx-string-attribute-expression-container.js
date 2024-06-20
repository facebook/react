function Component() {
  return (
    <div>
      <Text value={"\u0000"} />
      <Text value={"A\tE"} />
      <Text value={"나은"} />
      <Text value={"Sathya"} />
    </div>
  );
}

function Text({ value }) {
  return <span>{value}</span>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
