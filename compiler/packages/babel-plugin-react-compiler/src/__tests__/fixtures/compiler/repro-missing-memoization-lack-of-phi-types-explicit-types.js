// @flow @validatePreserveExistingMemoizationGuarantees @enableUseTypeAnnotations
import {useMemo} from 'react';
import {useFragment} from 'shared-runtime';

// This is a version of error.todo-repro-missing-memoization-lack-of-phi-types
// with explicit type annotations and using enableUseTypeAnnotations to demonstrate
// that type information is sufficient to preserve memoization in this example
function Component() {
  const data = useFragment();
  const nodes: Array<any> = data.nodes ?? [];
  const flatMap: Array<any> = nodes.flatMap(node => node.items);
  const filtered: Array<any> = flatMap.filter(item => item != null);
  const map: Array<any> = useMemo(() => filtered.map(), [filtered]);
  const index: Array<any> = filtered.findIndex(x => x === null);

  return (
    <div>
      {map}
      {index}
    </div>
  );
}
