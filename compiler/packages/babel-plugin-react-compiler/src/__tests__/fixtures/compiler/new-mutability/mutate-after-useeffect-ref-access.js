// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly

import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

function Component({arrRef}) {
  // Avoid taking arr.current as a dependency
  useEffect(() => print(arrRef.current));
  arrRef.current.val = 2;
  return arrRef;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{arrRef: {current: {val: 'initial ref value'}}}],
};
