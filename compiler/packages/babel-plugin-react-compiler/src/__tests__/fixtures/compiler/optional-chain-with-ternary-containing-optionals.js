// Ternary with optional chains in both branches
function Component({a, b, cond}) {
  return foo(cond ? a?.value : b?.value)?.result;
}
