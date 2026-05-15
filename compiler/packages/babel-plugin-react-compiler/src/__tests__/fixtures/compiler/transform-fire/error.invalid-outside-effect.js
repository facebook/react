// @enableFire
import {fire, useCallback} from 'react';

function Component({props, bar}) {
  const foo = () => {
    console.log(props);
  };
  fire(foo(props));

  useCallback(() => {
    fire(foo(props));
  }, [foo, props]);

  return null;
}
