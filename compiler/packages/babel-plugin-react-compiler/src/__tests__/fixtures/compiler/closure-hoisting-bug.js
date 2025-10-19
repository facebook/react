// @compilationMode(infer)
// Regression test for https://github.com/facebook/react/issues/34901
// The compiler should NOT outline functions that capture variables from their closure.
// In this case, `() => store` captures `store` from the outer scope and should not
// be hoisted to a top-level function because `store` would be undefined.

class SomeStore {
  test = 'hello';
}

function useLocalObservable(fn) {
  return fn();
}

export function createSomething() {
  const store = new SomeStore();

  const Cmp = () => {
    const observedStore = useLocalObservable(() => store);
    return <div>{observedStore.test}</div>;
  };

  return Cmp;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createSomething,
  params: [],
};
