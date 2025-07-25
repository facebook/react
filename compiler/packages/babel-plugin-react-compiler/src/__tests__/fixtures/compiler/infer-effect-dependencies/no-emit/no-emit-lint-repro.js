// @inferEffectDependencies @noEmit
import {print} from 'shared-runtime';
import useEffectWrapper from 'useEffectWrapper';
import {AUTODEPS} from 'react';

function ReactiveVariable({propVal}) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr), AUTODEPS);
}
