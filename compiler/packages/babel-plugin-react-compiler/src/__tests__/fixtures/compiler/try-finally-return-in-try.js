function Component() {
  try {
    return 1;
  } finally {
    console.log('cleanup');
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};
