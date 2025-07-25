// @flow
component Example() {
  const fooRef = useRef();

  function updateStyles() {
    const foo = fooRef.current;
    if (barRef.current == null || foo == null) {
      return;
    }
    foo.style.height = '100px';
  }

  const barRef = useRef(null);

  const resizeRef = useResizeObserver(rect => {
    const {width} = rect;
    barRef.current = width;
  });

  useLayoutEffect(() => {
    const observer = new ResizeObserver(_ => {
      updateStyles();
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={resizeRef} />;
}
