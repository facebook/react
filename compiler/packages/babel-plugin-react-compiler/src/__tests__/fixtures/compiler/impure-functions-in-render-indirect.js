// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render. The impurity is lost
 * when passed through external function calls.
 */
function Component() {
  const getDate = () => Date.now();
  const array = makeArray(getDate());
  const hasDate = identity(array);
  return <Foo hasDate={hasDate} />;
}
