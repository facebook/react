function Component(props) {
  // global propagation
  let a;
  a = Math;
  a; // Math

  // primitive propagation w phi
  let b;
  if (props) {
    b = true;
  } else {
    b = true;
  }
  b; // true

  // primitive propagation fails if different values
  let c;
  if (props) {
    c = true;
  } else {
    c = 42;
  }
  c; // <no change>

  // constant evaluation
  42 + 1; // 43
  42 - 1; // 41
  42 * 2; // 84
  42 / 2; // 21
  0 == 1; // false
  0 != 1; // true
  0 === 1; // false
  0 !== 1; // true
  0 == 0; // true
  // TODO: unary operators
  //   0 == -0; // false
  //   0 != -0; // true
  //   0 === -0; // false
  //   0 !== -0; // true
  NaN == NaN; // false
  NaN != NaN; // true
  NaN !== NaN; // true
  NaN !== NaN; // true
  "hello" == "hello"; // true
  "hello" != "hello"; // false
  "hello" === "hello"; // true
  "hello" !== "hello"; // false
  "hello" == "world"; // false
  "hello" != "world"; // true
  "hello" === "world"; // false
  "hello" !== "world"; // true
  true == true; // true
  true != true; // false
  true === true; // true
  true !== true; // false

  // constant evaluation through variable
  let x = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  x;
}
