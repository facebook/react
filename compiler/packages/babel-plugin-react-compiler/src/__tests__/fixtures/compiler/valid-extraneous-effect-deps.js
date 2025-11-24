// @loggerTestOnly @validateExtraneousEffectDependencies
import {useEffect, useLayoutEffect} from 'react';

function Component({a, b, x, y}) {
  // ok: all dependencies are used
  useEffect(() => {
    log(a, b);
  }, [a, b]);
  // ok: all dependencies are used
  useEffect(() => {
    log(a, b, b.c);
  }, [a, b, b.c]);
  // ok: no dependencies
  useEffect(() => {
    log('no deps');
  }, []);
}
