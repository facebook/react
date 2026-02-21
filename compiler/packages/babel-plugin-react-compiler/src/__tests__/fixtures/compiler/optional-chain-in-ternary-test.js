// Optional chain in ternary condition
function Component({a, b, c}) {
  return foo(a?.value, b?.value) ? c?.result : null;
}
