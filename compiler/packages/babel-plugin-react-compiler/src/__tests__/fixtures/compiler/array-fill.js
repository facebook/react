function Component() {
  const array = ['c', 'b', 'a'];
  return useMemo(() => {
    return [...array].fill(0);
  }, [array]);
}
