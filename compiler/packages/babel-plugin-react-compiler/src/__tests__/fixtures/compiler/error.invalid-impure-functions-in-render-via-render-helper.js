// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = Date.now();
  const renderItem = () => {
    const array = makeArray(now);
    const hasDate = identity(array);
    return <Bar hasDate={hasDate} />;
  };
  return <Foo renderItem={renderItem} />;
}
