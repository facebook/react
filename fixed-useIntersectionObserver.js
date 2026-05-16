import { useRef, useCallback, useEffect, useMemo } from 'react';

function useIntersectionObserver(options = {}) {
  const observerRef = useRef(null);
  const callbacksRef = useRef(new Map());

  // Callback function for IntersectionObserver - safely accesses refs in async context
  const handleIntersect = useCallback((entries) => {
    entries.forEach(entry => {
      const callback = callbacksRef.current.get(entry.target.id);
      if (callback) {
        callback(entry.isIntersecting);
      }
    });
  }, []);

  // Create observer memoized to avoid unnecessary recreation
  const observer = useMemo(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return null;
    }
    
    return new IntersectionObserver(handleIntersect, options);
  }, [handleIntersect, JSON.stringify(options)]);

  // Setup and cleanup observer
  useEffect(() => {
    if (!observer) {
      return;
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [observer]);

  // Register callback for a specific element
  const registerCallback = useCallback((elementId, callback) => {
    callbacksRef.current.set(elementId, callback);
    
    return () => {
      callbacksRef.current.delete(elementId);
    };
  }, []);

  // Observe an element
  const observe = useCallback((element) => {
    if (!observerRef.current || !element) {
      return;
    }
    
    observerRef.current.observe(element);
  }, []);

  // Unobserve an element
  const unobserve = useCallback((element) => {
    if (!observerRef.current || !element) {
      return;
    }
    
    observerRef.current.unobserve(element);
  }, []);

  return {
    observe,
    unobserve,
    registerCallback,
  };
}

export default useIntersectionObserver;
