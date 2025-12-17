// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    function nested() {
      function nestedAgain() {
        function nestedThrice() {
          fire(foo(props));
        }
        nestedThrice();
      }
      nestedAgain();
    }
    nested();
  });

  return null;
}
