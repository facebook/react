// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel

import {useEffect, useRef, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

function Component({arrRef}) {
  // Avoid taking arr.current as a dependency
  useEffect(() => print(arrRef.current), AUTODEPS);
  arrRef.current.val = 2;
  return arrRef;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{arrRef: {current: {val: 'initial ref value'}}}],
};
