function Component() {
  const array = ['c', 'b', 'a'];
  return useMemo(() => {
    return array.findLastIndex('b');
  }, [array]);
}
