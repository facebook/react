// Test case to reproduce the IntersectionObserver false positive bug

function useIntersectionObserver(options: Partial<IntersectionObserverInit>) {
  const callbacks = useRef(new Map<string, IntersectionCallback>());

  const onIntersect = useCallback((entries: ReadonlyArray<IntersectionObserverEntry>) => {
    entries.forEach(entry => callbacks.current.get(entry.target.id)?.(entry.isIntersecting))
  }, []
  );

  const observer = useMemo(() => 
    // This line incorrectly reports "Error: Cannot access refs during render"
    new IntersectionObserver(onIntersect, options),
    [onIntersect, options]
  );

  // Some other stuff here
}
