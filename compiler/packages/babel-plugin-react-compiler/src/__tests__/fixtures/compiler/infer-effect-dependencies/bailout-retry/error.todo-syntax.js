// @inferEffectDependencies @panicThreshold:"none"
import {useSpecialEffect} from 'shared-runtime';

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * We should surface these as actionable lint / build errors to devs.
 */
function Component({prop1}) {
  'use memo';
  useSpecialEffect(() => {
    try {
      console.log(prop1);
    } finally {
      console.log('exiting');
    }
  }, [prop1]);
  return <div>{prop1}</div>;
}
