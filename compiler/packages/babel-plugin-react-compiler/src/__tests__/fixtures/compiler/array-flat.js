function Component() {
  const array = [0, 1, 2, [3, 4]];
  return useMemo(() => array.flat(), [array]);
}
