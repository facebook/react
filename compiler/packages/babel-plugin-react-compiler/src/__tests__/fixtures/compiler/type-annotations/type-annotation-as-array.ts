// @enableUseTypeAnnotations
function Component(props: {id: number}) {
  const x = makeArray(props.id) as number[];
  const y = x.at(0);
  return y;
}

function makeArray<T>(x: T): Array<T> {
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{id: 42}],
};
