// @flow @enableNewMutationAliasingModel:false

import {identity, Stringify, useFragment} from 'shared-runtime';

component CometPageFinancialServicesVerifiedEntitiesListItem() {
  const data = useFragment();

  const {a, b} = identity(data);

  // This should memoize independently from `a`
  const iconWithToolTip = <Stringify tooltip={b} />;

  identity(a.at(0));

  return <Stringify icon={iconWithToolTip} />;
}
