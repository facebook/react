// @validatePreserveExistingMemoizationGuarantees

import {useState} from 'react';

// Object with function expression properties - should be memoized
// identically to method shorthand objects
function useBug() {
  const [setNodes, setEdges] = useState(null);
  return {
    test1: () => {
      setNodes('test');
    },
    test2: function () {
      setEdges('test');
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: useBug,
  params: [{}],
};
