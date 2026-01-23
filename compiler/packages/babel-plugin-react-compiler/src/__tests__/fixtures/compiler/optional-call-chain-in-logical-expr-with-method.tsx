import {Stringify, useIdentity} from 'shared-runtime';

function useFoo(props: {value: {getX(): string; getY(): string} | null}) {
  'use memo';
  const value = props.value;
  const result = useIdentity({x: value?.getX(), y: value?.getY()}) ?? {};
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{value: null}],
  sequentialRenders: [
    {value: null},
    {value: {getX: () => 'x1', getY: () => 'y1'}},
    {value: {getX: () => 'x2', getY: () => 'y2'}},
    {value: null},
  ],
};
