function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
  let i = 0;
  var x = [];

  class Bar {
    #secretSauce = 42;
    constructor() {
      console.log(this.#secretSauce);
    }
  }

  with (true) {
  }

  const g = { ...a };
  const h = [...b];
  new c(...args);
  c(...args);
  g["e"] += 1;

  <Button {...args}></Button>;
  <Button xlink:href="localhost:3000"></Button>;
  <Button haha={1}></Button>;

  const j = function bar([quz, qux], ...args) {};

  for (; i < 3; i += 1) {
    x.push(i);
  }
  for (; i < 3; ) {}
  for (;;) {}
}
