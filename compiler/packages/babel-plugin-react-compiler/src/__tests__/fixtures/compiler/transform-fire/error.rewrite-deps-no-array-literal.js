// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };

  const deps = [foo, props];

  useEffect(() => {
    fire(foo(props));
  }, deps);

  return null;
}
