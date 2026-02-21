// Mix of optional chain and logical AND in call args
function Component({a, b, c}) {
  return foo(a?.value, b && b.value, c?.value)?.result;
}
