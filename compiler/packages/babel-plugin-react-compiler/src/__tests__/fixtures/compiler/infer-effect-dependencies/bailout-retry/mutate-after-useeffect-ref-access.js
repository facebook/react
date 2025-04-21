// @inferEffectDependencies @panicThreshold(none)

import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

function Component({arrRef}) {
  // Avoid taking arr.current as a dependency
  useEffect(() => print(arrRef.current));
  arr.current.val = 2;
  return arr;
}
