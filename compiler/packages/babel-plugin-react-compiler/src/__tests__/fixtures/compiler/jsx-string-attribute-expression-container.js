function Component() {
  return (
    <div>
      <Text value={'\n'} />
      <Text value={'A\tE'} />
      <Text value={'나은'} />
      <Text value={'Lauren'} />
      <Text value={'சத்யா'} />
      <Text value={'Sathya'} />
    </div>
  );
}

function Text({value}) {
  return <span>{value}</span>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
