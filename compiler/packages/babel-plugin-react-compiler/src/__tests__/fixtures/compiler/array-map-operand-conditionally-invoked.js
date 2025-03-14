function useFoo({arr}) {
  return arr.map(e => arr[0].value + e.value);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{arr: []}],
  sequentialRenders: [{arr: []}, {arr: [{value: 1}, {value: 2}]}],
};
