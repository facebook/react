// @enableFire
import {fire} from 'react';

function Component(props) {
  useEffect(() => {
    const log = () => {
      console.log(props);
    };
    fire(log)();
  });

  return null;
}
