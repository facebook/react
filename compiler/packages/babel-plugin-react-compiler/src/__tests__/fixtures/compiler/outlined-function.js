// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';
/**
 * This compiled output is technically incorrect but this is currently the same
 * case as a bailout (an effect that overfires).
 *
 * To ensure an empty deps array is passed, we need special case
 * `InferEffectDependencies` for outlined functions (likely easier) or run it
 * before OutlineFunctions
 */
function OutlinedFunctionInEffect() {
  useEffect(() => print('hello world!'));
}
