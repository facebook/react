// @dynamicGating:{"source":"shared-runtime"} @panicThreshold:"none" @inferEffectDependencies
import {useEffect, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

function ReactiveVariable({propVal}) {
  'use memo if(invalid identifier)';
  const arr = [propVal];
  useEffect(() => print(arr), AUTODEPS);
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveVariable,
  params: [{}],
};
