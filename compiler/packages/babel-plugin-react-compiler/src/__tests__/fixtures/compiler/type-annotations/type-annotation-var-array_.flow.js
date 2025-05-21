// @flow @enableUseTypeAnnotations
import {identity} from 'shared-runtime';

function Component(props: {id: number}) {
  const x: Array<number> = makeArray(props.id);
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
