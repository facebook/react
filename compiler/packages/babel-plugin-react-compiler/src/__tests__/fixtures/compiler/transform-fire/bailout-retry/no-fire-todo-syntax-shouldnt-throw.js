// @enableFire @panicThreshold:"none"
import {fire} from 'react';

/**
 * Compilation of this file should succeed.
 */
function NonFireComponent({prop1}) {
  /**
   * This component bails out but does not use fire
   */
  const foo = () => {
    try {
      console.log(prop1);
    } finally {
      console.log('jbrown215');
    }
  };
  useEffect(() => {
    foo();
  });
}

function FireComponent(props) {
  /**
   * This component uses fire and compiles successfully
   */
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
  });

  return null;
}
