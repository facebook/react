import {ValidateMemoization} from 'shared-runtime';

function Component() {
  const x = {};
  const y = {
    x,
    valueOf() {
      return x;
    },
  };
  y.valueOf().z = true;

  return <ValidateMemoization inputs={[x]} output={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};
