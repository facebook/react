// @flow
function Component({value}) {
  const derived = 0 / 0; // NaN
  const result = useMemo(() => [derived], [derived]);
  return result;
}
