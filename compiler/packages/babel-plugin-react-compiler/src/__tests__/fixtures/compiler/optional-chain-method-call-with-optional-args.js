// Optional method call with optional args
function Component({obj, a, b}) {
  return obj?.method(a?.value, b?.value);
}
