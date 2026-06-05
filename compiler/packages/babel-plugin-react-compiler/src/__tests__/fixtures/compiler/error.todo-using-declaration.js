function useResource() {
  using resource = createResource();
  return resource.value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useResource,
  params: [],
  isComponent: false,
};
