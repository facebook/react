// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const getDate = () => Date.now();
  const array = makeArray(getDate());
  const hasDate = identity(array);
  return <Foo hasDate={hasDate} />;
}
