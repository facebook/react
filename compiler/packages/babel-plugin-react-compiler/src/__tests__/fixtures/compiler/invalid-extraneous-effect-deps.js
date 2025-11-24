// @loggerTestOnly @validateExtraneousEffectDependencies
import {useEffect, useLayoutEffect} from 'react';

function Component({a, b, x, y}) {
  // error: `b` is not used in the effect
  useEffect(() => {
    log(a);
  }, [a, b]);
  // error: `x` and `y` are not used in the effect
  useEffect(() => {
    log('hello');
  }, [x, y]);
  // error: works with useLayoutEffect too
  useLayoutEffect(() => {
    log(a);
  }, [a, b]);
  // error: more precise dep
  useEffect(() => {
    log(a, b);
  }, [a, b.c]);
}
