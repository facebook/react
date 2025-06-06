// @inferEffectDependencies
import {useEffect} from 'react';
import {print, shallowCopy} from 'shared-runtime';

function ReactiveMemberExpr({cond, propVal}) {
  const obj = {a: cond ? {b: propVal} : null, c: null};
  const other = shallowCopy({a: {b: {c: {d: {e: {f: propVal + 1}}}}}});
  const primitive = shallowCopy(propVal);
  useEffect(() =>
    print(obj.a?.b, other?.a?.b?.c?.d?.e.f, primitive.a?.b.c?.d?.e.f)
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveMemberExpr,
  params: [{cond: true, propVal: 1}],
};
