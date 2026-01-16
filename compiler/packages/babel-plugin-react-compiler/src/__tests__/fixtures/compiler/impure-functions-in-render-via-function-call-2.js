// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render. The impurity is lost
 * when passed through external function calls.
 */
function Component() {
  const now = () => Date.now();
  const f = () => {
    const array = makeArray(now());
    const hasDate = identity(array);
    return hasDate;
  };
  const hasDate = f();
  return <Foo hasDate={hasDate} />;
}
