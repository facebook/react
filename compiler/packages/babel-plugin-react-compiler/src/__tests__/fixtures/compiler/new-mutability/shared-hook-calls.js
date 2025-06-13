// @enableFire
import {fire} from 'react';

function Component({bar, baz}) {
  const foo = () => {
    console.log(bar);
  };
  useEffect(() => {
    fire(foo(bar));
    fire(baz(bar));
  });

  useEffect(() => {
    fire(foo(bar));
  });

  return null;
}
