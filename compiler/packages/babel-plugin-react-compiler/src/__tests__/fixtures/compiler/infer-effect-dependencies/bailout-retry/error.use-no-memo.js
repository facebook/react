// @inferEffectDependencies @panicThreshold:"none"
import {useEffect} from 'react';

function Component({propVal}) {
  'use no memo';
  useEffect(() => [propVal]);
}
