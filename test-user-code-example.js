// Test case for the exact user code example
function useIntersectionObserver(options) {
  const callbacks = useRef(new Map());

  const onIntersect = useCallback((entries) => {
    entries.forEach(entry =>
      callbacks.current.get(entry.target.id)?.(entry.isIntersecting)
    );
  }, []);

  const observer = useMemo(() =>
    new IntersectionObserver(onIntersect, options),
    [onIntersect, options]
  );
}
