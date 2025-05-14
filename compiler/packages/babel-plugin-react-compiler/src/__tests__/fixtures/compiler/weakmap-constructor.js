import {ValidateMemoization} from 'shared-runtime';

function Component({a, b, c}) {
  const map = new WeakMap();
  const mapAlias = map.set(a, 0);
  mapAlias.set(c, 0);

  const hasB = map.has(b);

  return (
    <>
      <ValidateMemoization inputs={[a, c]} output={map} />
      <ValidateMemoization inputs={[a, c]} output={mapAlias} />
      <ValidateMemoization inputs={[b]} output={[hasB]} />
    </>
  );
}

const v1 = {value: 1};
const v2 = {value: 2};
const v3 = {value: 3};
export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: v1, b: v1, c: v1}],
  sequentialRenders: [
    {a: v1, b: v1, c: v1},
    {a: v2, b: v1, c: v1},
    {a: v1, b: v1, c: v1},
    {a: v1, b: v2, c: v1},
    {a: v1, b: v1, c: v1},
    {a: v3, b: v3, c: v1},
    {a: v3, b: v3, c: v1},
    {a: v1, b: v1, c: v1},
  ],
};
