/**
 * Test case for IntersectionObserver false positive fix
 * This should NOT trigger the "Cannot access refs during render" error
 */

import {useRef, useCallback, useMemo} from 'react';

function useIntersectionObserver(options) {
  const callbacks = useRef(new Map());

  const onIntersect = useCallback((entries) => {
    // This ref access should be allowed - it's inside a callback, not during render
    entries.forEach(entry => {
      const callback = callbacks.current.get(entry.target.id);
      if (callback) {
        callback(entry.isIntersecting);
      }
    });
  }, []);

  const observer = useMemo(() => 
    // This should NOT trigger the ref access error anymore
    new IntersectionObserver(onIntersect, options),
    [onIntersect, options]
  );

  return observer;
}

// This function accesses a ref during render - SHOULD trigger an error
function BadComponent() {
  const ref = useRef(null);
  const value = ref.current; // This should still error
  return <div>{value}</div>;
}
