async function useAsyncResource() {
  await using resource = createAsyncResource();
  return resource.value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useAsyncResource,
  params: [],
  isComponent: false,
};
