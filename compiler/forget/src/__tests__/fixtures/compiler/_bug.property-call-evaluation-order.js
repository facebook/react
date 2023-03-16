// Should print A, arg, original

function changeF(o) {
  o.f = () => console.log("new");
}

function Component() {
  let x = {
    f: () => console.log("original"),
  };

  (console.log("A"), x).f((changeF(x), console.log("arg"), 1));
  return x;
}
