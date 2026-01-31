function Component({a, b}) {
  'use memo';
  return useHook(a?.value, b?.value) ?? {};
}
