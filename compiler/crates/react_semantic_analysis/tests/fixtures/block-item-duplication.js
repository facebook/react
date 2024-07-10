function Component() {
  let a = 1;
  let a = 2; // error

  const b = 3;
  const b = 4; // error

  function foo() {}
  function foo() {} // error

  try {
  } catch (c) {
    let c = true; // error
    const c = true; // error
    function c() {} // error
    // class c {} // error
  }
}

function Component() {
  // error
}

const x = true;
const x = false; // error
