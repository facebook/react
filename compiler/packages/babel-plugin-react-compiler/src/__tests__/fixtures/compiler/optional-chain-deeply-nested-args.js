// Deeply nested optional chains as args
function Component({a, b}) {
  return foo(a?.b?.c?.d, b?.e?.f?.g)?.result?.final;
}
