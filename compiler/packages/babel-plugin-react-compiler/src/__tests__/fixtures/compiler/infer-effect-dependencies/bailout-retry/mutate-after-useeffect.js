// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly
import {useEffect, AUTODEPS} from 'react';

function Component({foo}) {
  const arr = [];
  useEffect(() => {
    arr.push(foo);
  }, AUTODEPS);
  arr.push(2);
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 1}],
};
