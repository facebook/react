// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import {useEffect} from 'react';

function Component({foo}) {
  const arr = [];
  useEffect(() => {
    arr.push(foo);
  });
  arr.push(2);
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 1}],
};
