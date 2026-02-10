export function useFoo(id: string) {
  const bar = useBar();
  const b = transform(bar);

  const {data} = useBaz(options(id));
  const c = transform2(b, data);

  useQux();
  const d = transform3(c);

  return d;
}
