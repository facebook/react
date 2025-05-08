// @flow @enableTransitivelyFreezeFunctionExpressions:false
import {setPropertyByKey, Stringify} from 'shared-runtime';

function useFoo({a}: {a: number, b: number}) {
  const arr = [];
  const obj = {value: a};

  setPropertyByKey(obj, 'arr', arr);
  const obj_alias = obj;
  const cb = () => obj_alias.arr.length;
  for (let i = 0; i < a; i++) {
    arr.push(i);
  }
  return <Stringify cb={cb} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: 2}],
  sequentialRenders: [{a: 2}, {a: 3}],
};
