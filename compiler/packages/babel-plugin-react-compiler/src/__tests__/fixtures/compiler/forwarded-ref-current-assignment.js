// Test case for issue #34955
// Assigning to ref.current should be allowed for forwarded refs
import {useCallback, useState} from 'react';

function useContainerWidth(ref) {
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useCallback(
    node => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        // This is a legitimate ref.current assignment and should not error
        ref.current = node;
      }
      if (node !== null) {
        setContainerWidth(node.offsetWidth);
      }
    },
    [ref],
  );

  return {containerRef, containerWidth};
}

export const FIXTURE_ENTRYPOINT = {
  fn: useContainerWidth,
  params: [{current: null}],
};

