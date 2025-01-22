// @inferEffectDependencies
import * as React from 'react';

/**
 * TODO: recognize import namespace
 */
function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj));
}
