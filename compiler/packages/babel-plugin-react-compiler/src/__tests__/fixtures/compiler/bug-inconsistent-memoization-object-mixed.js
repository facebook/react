function Component({a, b, c}) {
  return {
    test1() {
      console.log(a);
    },
    test2: () => {
      console.log(b);
    },
    test3: function () {
      console.log(c);
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1, b: 2, c: 3}],
};
