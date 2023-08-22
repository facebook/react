function Component(props) {
  let y = 0;
  foo: for (let x = 0; x < 10; x++) {
    if (x == 7) {
      break foo;
    }
    y = x + y;
    continue foo;
  }
  bar: if (props) {
    break bar;
  }
}
