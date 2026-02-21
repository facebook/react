// Short-circuit logical with multiple optional chains
function Component({a, b, c}) {
  return a?.value && foo(b?.value, c?.value)?.result;
}
