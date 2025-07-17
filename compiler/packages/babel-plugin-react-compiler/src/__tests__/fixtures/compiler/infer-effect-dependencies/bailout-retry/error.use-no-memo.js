// @inferEffectDependencies @panicThreshold:"none"
import {useEffect, AUTODEPS} from 'react';

function Component({propVal}) {
  'use no memo';
  useEffect(() => [propVal], AUTODEPS);
}
