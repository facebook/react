import {Stringify} from 'shared-runtime';

function foo() {
  return (
    <Stringify
      value={[
        12n | 0n,
        12n & 0n,
        12n ^ 0n,
        12n | 3n,
        12n & 5n,
        12n ^ 7n,
        12n >> 0n,
        12n >> 1n,
        4n % 2n,
      ]}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};
