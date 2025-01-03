// @flow @enableUseTypeAnnotations
import {identity, makeArray} from 'shared-runtime';

function Component(props: {id: number}) {
  const x = (makeArray(props.id): Array<number>);
  const y = x.at(0);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{id: 42}],
};
