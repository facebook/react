// Chained optional method calls with optional args
function Component({obj, a, b, c}) {
  return obj(a?.value)?.second(b?.value);
}
