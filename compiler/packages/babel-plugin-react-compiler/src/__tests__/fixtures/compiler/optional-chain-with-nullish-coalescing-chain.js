// Nullish coalescing with optional chain result
function Component({a, b, fallback}) {
  return (foo(a?.value, b?.value) ?? fallback)?.result;
}
