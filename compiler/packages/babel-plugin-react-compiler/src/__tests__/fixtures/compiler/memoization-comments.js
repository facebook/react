// @enableMemoizationComments
import {addOne, getNumber, identity} from 'shared-runtime';

function Component(props) {
  const x = identity(props.a);
  const y = addOne(x);
  const z = identity(props.b);
  return [x, y, z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1, b: 10}],
};
