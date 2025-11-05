// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import useMyEffect from 'useEffectWrapper';
import {AUTODEPS} from 'react';

function nonReactFn(arg) {
  useMyEffect(() => [1, 2, arg], AUTODEPS);
}
