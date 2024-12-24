// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function ReactiveVariable({propVal}) {
  const arr = [propVal];
  useEffect(() => print(arr));
}
