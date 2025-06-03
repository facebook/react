// @inferEffectDependencies @panicThreshold:"none"
import React from 'react';

function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj));
}
