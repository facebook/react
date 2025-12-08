function Component() {
  let x = 0;
  const inc = () => {
    x++;
  };
  inc();
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};
