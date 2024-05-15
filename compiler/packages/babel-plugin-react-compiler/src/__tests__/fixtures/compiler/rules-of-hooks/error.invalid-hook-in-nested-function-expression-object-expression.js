// @compilationMode(infer)
function Component() {
  const f = () => {
    const x = {
      outer() {
        const g = () => {
          const y = {
            inner() {
              return useFoo();
            },
          };
          return y;
        };
      },
    };
    return x;
  };
}
