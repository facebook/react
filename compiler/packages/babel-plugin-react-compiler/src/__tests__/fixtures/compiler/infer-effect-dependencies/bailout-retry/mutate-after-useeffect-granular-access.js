// @inferEffectDependencies @panicThreshold:"none"
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function Component({foo}) {
  const arr = [];
  // Taking either arr[0].value or arr as a dependency is reasonable
  // as long as developers know what to expect.
  useEffect(() => print(arr[0].value));
  arr.push({value: foo});
  return arr;
}
