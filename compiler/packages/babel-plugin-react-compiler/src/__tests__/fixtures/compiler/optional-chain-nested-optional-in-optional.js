// Nested optional chains: outer optional calling inner optional result
function Component({a, b}) {
  return foo(a?.bar?.baz, b?.qux)?.result;
}
