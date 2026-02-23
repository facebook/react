// Three optional chain arguments
function Component({a, b, c}) {
  return foo(a?.value, b?.value, c?.value)?.result;
}
