// @validateNoImpureFunctionsInRender

import {typedArrayPush, typedIdentity} from 'shared-runtime';

function Component() {
  const now = () => Date.now();
  const renderItem = () => {
    const array = [];
    typedArrayPush(array, now());
    const hasDate = typedIdentity(array);
    return <Bar hasDate={hasDate} />;
  };
  return <Foo renderItem={renderItem} />;
}
