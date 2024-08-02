let b = 1;

export default function useMyHook() {
  const fn = () => {
    b = 2;
  };
  const obj = { fn };
  const arr = [obj];
  foo(arr);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMyHook,
  params: [],
};
