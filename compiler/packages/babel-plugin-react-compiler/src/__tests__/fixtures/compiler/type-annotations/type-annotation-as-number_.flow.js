// @flow @enableUseTypeAnnotations
import {identity} from 'shared-runtime';

function Component(props: {id: number}) {
  const x = identity(props.id);
  const y = (x: number);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{id: 42}],
};
