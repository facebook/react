// @enableFire
import {fire} from 'react';

function Component({prop1}) {
  const foo = () => {
    console.log(prop1);
  };
  useEffect(() => {
    fire(foo(prop1));
  });
  prop1.value += 1;
}
