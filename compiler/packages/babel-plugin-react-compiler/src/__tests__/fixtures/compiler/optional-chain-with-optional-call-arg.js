// Optional call as argument to another optional chain
function Component({a, b}) {
  return foo(a?.(), b?.value)?.result;
}
