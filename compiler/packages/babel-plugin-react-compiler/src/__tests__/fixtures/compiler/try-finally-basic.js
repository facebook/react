function Component() {
  let x;
  try {
    x = 1;
  } finally {
    console.log('cleanup');
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};
