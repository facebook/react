function Component({a, b}) {
  return {
    test1: () => {
      console.log(a);
    },
    test2: function () {
      console.log(b);
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1, b: 2}],
};
