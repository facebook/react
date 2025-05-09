// @enableFire @panicThreshold:"none"
import {fire} from 'react';

/**
 * TODO: we should eventually distinguish between `use no memo` and `use no
 * compiler` directives. The former should be used to *only* disable memoization
 * features.
 */
function Component({props, bar}) {
  'use no memo';
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
    fire(foo());
    fire(bar());
  });

  return null;
}
