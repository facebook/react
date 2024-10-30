import {ValidateMemoization} from 'shared-runtime';

function Component() {
  const x = {
    valueOf() {
      return this;
    },
  };
  x.valueOf().y = true;

  return <ValidateMemoization inputs={[x]} output={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};
