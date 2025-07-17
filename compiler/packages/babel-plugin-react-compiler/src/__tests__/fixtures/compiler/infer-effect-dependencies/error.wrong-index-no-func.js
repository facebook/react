// @inferEffectDependencies
import {useEffect, AUTODEPS} from 'react';

function Component({foo}) {
  useEffect(AUTODEPS);
}
