// @loggerTestOnly
function component(a) {
  let x = useMemo(() => {
    mutate(a);
  }, []);
  return x;
}
