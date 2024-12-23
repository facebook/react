// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

// TODO: take optional chains as dependencies
function ReactiveMemberExpr({cond, propVal}) {
  const obj = {a: cond ? {b: propVal} : null};
  useEffect(() => print(obj.a?.b));
}
