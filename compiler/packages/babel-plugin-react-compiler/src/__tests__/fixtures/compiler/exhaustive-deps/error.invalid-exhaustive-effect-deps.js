// @validateExhaustiveEffectDependencies
import {useEffect} from 'react';

function Component({x, y, z}) {
  // error: missing dep - x
  useEffect(() => {
    console.log(x);
  }, []);

  // error: extra dep - y
  useEffect(() => {
    console.log(x);
  }, [x, y]);
}
