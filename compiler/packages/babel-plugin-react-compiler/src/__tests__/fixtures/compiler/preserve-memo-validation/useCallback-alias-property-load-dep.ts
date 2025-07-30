// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';
import {sum} from 'shared-runtime';

function Component({propA, propB}) {
  const x = propB.x.y;
  return useCallback(() => {
    return sum(propA, x);
  }, [propA, x]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propA: 2, propB: {x: {y: 3}}}],
};
