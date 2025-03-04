// @inferEffectDependencies @panicThreshold(none)
import React from 'react';

function Component() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj));
}
