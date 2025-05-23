// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import useMyEffect from 'useEffectWrapper';

function nonReactFn(arg) {
  useMyEffect(() => [1, 2, arg]);
}
