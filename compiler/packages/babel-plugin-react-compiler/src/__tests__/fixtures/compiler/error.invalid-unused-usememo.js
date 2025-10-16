// @validateNoVoidUseMemo
function Component() {
  useMemo(() => {
    return [];
  }, []);
  return <div />;
}
