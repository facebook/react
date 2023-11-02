function Component(props) {
  let x = 0;
  let y = 0;
  let z = 0;
  do {
    x += 1;
    y += 1;
    z = y;
  } while (x < props.limit);
  return [z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ limit: 10 }],
  // TODO: test executing the sequence {limit: 10}, {limit: 1}, {limit: 10}
};
