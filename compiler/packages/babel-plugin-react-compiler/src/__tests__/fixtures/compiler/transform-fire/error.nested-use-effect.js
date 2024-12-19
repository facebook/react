// @enable
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    useEffect(() => {
      function nested() {
        fire(foo(props));
      }

      nested();
    });
  });

  return null;
}
