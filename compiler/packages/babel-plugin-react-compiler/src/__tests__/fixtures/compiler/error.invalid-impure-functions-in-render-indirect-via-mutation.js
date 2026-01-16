// @validateNoImpureFunctionsInRender

import {arrayPush, identity, makeArray} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render. The impurity is lost
 * when passed through external function calls.
 */
function Component() {
  const getDate = () => Date.now();
  const now = getDate();
  const array = [];
  arrayPush(array, now);
  return <Foo hasDate={array} />;
}
