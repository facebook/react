// @enableUseTypeAnnotations
function useArray(items: Array<number>) {
  // With type information we know that the callback cannot escape
  // and does not need to be memoized, only the result needs to be
  // memoized:
  return items.filter(x => x !== 0);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useArray,
  params: [[1, 0, 2, 0, 3, 0, 42]],
};
