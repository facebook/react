import {makeArray} from 'shared-runtime';

function Component(props) {
  const items = makeArray(0, 1, 2, null, 4, false, 6);
  const max = Math.max(...items.filter(Boolean));
  return max;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
