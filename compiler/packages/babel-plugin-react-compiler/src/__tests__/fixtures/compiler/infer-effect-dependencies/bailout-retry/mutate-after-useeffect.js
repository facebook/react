// @inferEffectDependencies @panicThreshold:"none"
import {useEffect} from 'react';

function Component({foo}) {
  const arr = [];
  useEffect(() => arr.push(foo));
  arr.push(2);
  return arr;
}
