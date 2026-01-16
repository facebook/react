// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = Date.now();
  const renderItem = () => {
    const array = makeArray(now);
    // we don't have an alias signature for identity(), so we optimistically
    // assume this doesn't propagate the impurity
    const hasDate = identity(array);
    return <Bar hasDate={hasDate} />;
  };
  return <Foo renderItem={renderItem} />;
}
