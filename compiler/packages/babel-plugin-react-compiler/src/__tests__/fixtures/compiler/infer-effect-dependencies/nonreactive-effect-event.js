// @inferEffectDependencies
import {useEffect, useEffectEvent, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

/**
 * We do not include effect events in dep arrays.
 */
function NonReactiveEffectEvent() {
  const fn = useEffectEvent(() => print('hello world'));
  useEffect(() => fn(), AUTODEPS);
}
