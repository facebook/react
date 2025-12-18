// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = () => Date.now();
  const f = () => {
    // this should error but we currently lose track of the impurity bc
    // the impure value comes from behind a call
    const array = makeArray(now());
    const hasDate = identity(array);
    return hasDate;
  };
  const hasDate = f();
  return <Foo hasDate={hasDate} />;
}
