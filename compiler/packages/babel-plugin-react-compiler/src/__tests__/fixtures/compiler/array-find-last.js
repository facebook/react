function Component() {
  const array = ['c', 'b', 'a'];
  return useMemo(() => {
    return array.findLast(el => el === 'a');
  }, [array]);
}
