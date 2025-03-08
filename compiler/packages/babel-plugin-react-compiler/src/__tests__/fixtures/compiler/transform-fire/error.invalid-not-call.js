// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    foo(fire(props)); // Can't be used as a function argument
    const stored = fire(foo); // Cannot be assigned
    fire(props); // Invalid as an expression statement
  });

  return null;
}
