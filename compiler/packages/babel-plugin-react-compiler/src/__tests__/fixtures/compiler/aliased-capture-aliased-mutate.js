// @flow @enableTransitivelyFreezeFunctionExpressions:false
import {arrayPush, setPropertyByKey, Stringify} from 'shared-runtime';

function useFoo({a, b}: {a: number, b: number}) {
  const x = [];
  const y = {value: a};

  arrayPush(x, y); // x and y co-mutate
  const y_alias = y;
  const cb = () => y_alias.value;
  setPropertyByKey(x[0], 'value', b); // might overwrite y.value
  return <Stringify cb={cb} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: 2, b: 10}],
  sequentialRenders: [
    {a: 2, b: 10},
    {a: 2, b: 11},
  ],
};
