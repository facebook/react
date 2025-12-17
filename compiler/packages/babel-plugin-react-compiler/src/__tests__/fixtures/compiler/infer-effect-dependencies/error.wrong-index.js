// @inferEffectDependencies
import {AUTODEPS} from 'react';
import useEffectWrapper from 'useEffectWrapper';

function Component({foo}) {
  useEffectWrapper(
    () => {
      console.log(foo);
    },
    [foo],
    AUTODEPS
  );
}
