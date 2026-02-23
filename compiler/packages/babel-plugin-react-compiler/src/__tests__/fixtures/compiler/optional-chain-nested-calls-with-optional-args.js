// Nested function calls with optional args at multiple levels
function Component({a, b, c}) {
  return outer(inner(a?.value, b?.value)?.mid, c?.value)?.result;
}
