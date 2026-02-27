function Component(props) {
  const items = [0, 1, 2];
  return items.reduce((agg, item) => {
    const current = agg.count++;
    agg.res.push(current);
    return agg;
  }, {count: 0, res: []});
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
