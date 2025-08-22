function Component() {
  const array = ['c', 'b', 'a'];
  return useMemo(() => {
    return [...array].copyWithin(0, 2);
  }, [array]);
}
