declare function id<T>(x: T): T;

export function test<T = string>(value = id<string>('hi')) {
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: test,
  params: [],
  isComponent: false,
};
