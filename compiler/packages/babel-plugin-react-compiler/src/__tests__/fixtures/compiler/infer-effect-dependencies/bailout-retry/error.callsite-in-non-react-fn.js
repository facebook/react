// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import {useEffect} from 'react';

function nonReactFn(arg) {
  useEffect(() => [1, 2, arg]);
}
