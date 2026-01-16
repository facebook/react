// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = Date.now();
  const f = () => {
    const array = makeArray(now);
    const hasDate = identity(array);
    return hasDate;
  };
  const hasDate = f();
  return <Foo hasDate={hasDate} />;
}
