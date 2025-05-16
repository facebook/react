// @dynamicGating:{"source":"shared-runtime"} @panicThreshold:"none" @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function ReactiveVariable({propVal}) {
  'use memo if(invalid identifier)';
  const arr = [propVal];
  useEffect(() => print(arr));
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveVariable,
  params: [{}],
};
