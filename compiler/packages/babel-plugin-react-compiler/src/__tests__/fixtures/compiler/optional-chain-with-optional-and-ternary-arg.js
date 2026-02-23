// Optional chain with ternary and optional args
function Component({a, b, cond}) {
  return foo(a?.value, cond ? b : null)?.result;
}
