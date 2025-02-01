// @inferEffectDependencies
import * as React from 'react';
import * as SharedRuntime from 'shared-runtime';

function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj));
  SharedRuntime.useSpecialEffect(() => print(obj), [obj]);
}
