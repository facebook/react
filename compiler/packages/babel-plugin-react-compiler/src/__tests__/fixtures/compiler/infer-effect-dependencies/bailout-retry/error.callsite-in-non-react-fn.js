// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import {useEffect, AUTODEPS} from 'react';

function nonReactFn(arg) {
  useEffect(() => [1, 2, arg], AUTODEPS);
}
