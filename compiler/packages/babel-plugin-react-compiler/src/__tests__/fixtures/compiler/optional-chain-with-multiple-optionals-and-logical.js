// Multiple optional args with logical fallback
function Component({a, b}) {
  return foo(a?.value, b?.value)?.result ?? [];
}
