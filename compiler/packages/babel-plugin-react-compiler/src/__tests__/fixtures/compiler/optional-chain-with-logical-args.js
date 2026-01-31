// Optional chain with logical expressions as args
function Component({a, b, c}) {
  return foo(a?.value ?? b, c?.value || 'default')?.result;
}
