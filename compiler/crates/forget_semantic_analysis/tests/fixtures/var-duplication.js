function Component() {
  let a;
  {
    var a; // error, conflicts when hoisted
  }

  const b = 1;
  {
    var b; // error, conflicts
  }

  {
    let c;
    var c; // error, conflicts
  }

  {
    const d = 2;
    var d; // error, conflicts
  }

  // there should be one instance of `e`:
  var e = 3;
  console.log(e); // 3
  var e = 4;
  console.log(e); // 4
  var e;
  console.log(e); // 4
}
