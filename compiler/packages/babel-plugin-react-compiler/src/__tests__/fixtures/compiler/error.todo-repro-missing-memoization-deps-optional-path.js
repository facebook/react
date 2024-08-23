// @flow @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {useFragment} from 'shared-runtime';

function useData({items}) {
  const data = useMemo(
    () => items?.edges?.nodes.map(item => <Item item={item} />),
    [items?.edges?.nodes]
  );
  return data;
}
