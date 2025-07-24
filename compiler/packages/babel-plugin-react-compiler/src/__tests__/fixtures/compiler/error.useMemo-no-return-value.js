// @enableValidateNoVoidUseMemo
function Component() {
  const value = useMemo(() => {
    console.log('computing');
  }, []);
  return <div>{value}</div>;
}
