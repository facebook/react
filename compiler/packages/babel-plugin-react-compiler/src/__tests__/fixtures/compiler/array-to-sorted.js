function Component() {
  const array = ['c', 'b', 'a'];
  return useMemo(() => array.toSorted(), [array]);
}
