// @dynamicGating:{"source":"shared-runtime"} @inferEffectDependencies @panicThreshold:"none"

import useEffectWrapper from 'useEffectWrapper';
import {AUTODEPS} from 'react';

/**
 * TODO: run the non-forget enabled version through the effect inference
 * pipeline.
 */
function Component({foo}) {
  'use memo if(getTrue)';
  const arr = [];
  useEffectWrapper(() => arr.push(foo), AUTODEPS);
  arr.push(2);
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 1}],
  sequentialRenders: [{foo: 1}, {foo: 2}],
};
