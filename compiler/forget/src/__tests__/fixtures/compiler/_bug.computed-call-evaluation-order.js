// Should print A, B, arg, original
function changeF(o) {
  o.f = () => console.log("new");
}

function Component() {
  let x = {
    f: () => console.log("original"),
  };

  (console.log("A"), x)[(console.log("B"), "f")](
    (changeF(x), console.log("arg"), 1)
  );
  return x;
}
