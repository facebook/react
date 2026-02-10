export function useFoo(id: string) {
  const bar = useBar();
  const value = func(bar);

  const {data} = useBaz(value);
  const a = result(data, value);

  return a;
}
