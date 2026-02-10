export function useFoo(id: string, value: number) {
  const {data} = useBaz(options(id));
  const a = result(data, value);

  return a;
}
