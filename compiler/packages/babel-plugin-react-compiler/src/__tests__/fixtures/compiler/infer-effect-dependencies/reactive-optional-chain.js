// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function ReactiveMemberExpr({cond, propVal}) {
  const obj = {a: cond ? {b: propVal} : null, c: null};
  useEffect(() => print(obj.a?.b));
  useEffect(() => print(obj.c?.d));
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveMemberExpr,
  params: [{cond: true, propVal: 1}],
};
