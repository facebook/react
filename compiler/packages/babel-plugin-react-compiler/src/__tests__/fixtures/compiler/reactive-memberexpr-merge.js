// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function ReactiveMemberExprMerge({propVal}) {
  const obj = {a: {b: propVal}};
  useEffect(() => print(obj.a, obj.a.b));
}
