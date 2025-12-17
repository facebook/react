// @inferEffectDependencies
import * as React from 'react';
import * as SharedRuntime from 'shared-runtime';

function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj), React.AUTODEPS);
  SharedRuntime.useSpecialEffect(() => print(obj), [obj], React.AUTODEPS);
}
