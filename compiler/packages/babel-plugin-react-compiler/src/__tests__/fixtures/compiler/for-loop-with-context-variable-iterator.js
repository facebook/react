import {Stringify, useIdentity} from 'shared-runtime';

function Component() {
  const data = useIdentity(
    new Map([
      [0, 'value0'],
      [1, 'value1'],
    ])
  );
  const items = [];
  // NOTE: `i` is a context variable because it's reassigned and also referenced
  // within a closure, the `onClick` handler of each item
  for (let i = MIN; i <= MAX; i += INCREMENT) {
    items.push(
      <Stringify key={i} onClick={() => data.get(i)} shouldInvokeFns={true} />
    );
  }
  return <>{items}</>;
}

const MIN = 0;
const MAX = 3;
const INCREMENT = 1;

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: Component,
};
