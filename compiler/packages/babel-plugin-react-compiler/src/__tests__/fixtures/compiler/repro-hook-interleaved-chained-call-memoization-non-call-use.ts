export function useFoo(id: string) {
  const bar = useBar();
  const value = func(bar);
  const arr = [value];

  const {data} = useBaz(options(id));
  const a = result(data, value);

  return [a, arr];
}
