function Component() {
  const groupRefs = {
    group1: useRef(null),
    group2: useRef(null),
  };
  return (
    <>
      <Child ref={groupRefs.group1} />
      <Child ref={groupRefs.group2} />
    </>
  );
}