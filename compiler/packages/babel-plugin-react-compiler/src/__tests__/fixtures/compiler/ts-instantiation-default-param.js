function id<T>(x: T): T {
  return x;
}

export function Component<T = string>({value = id<string>('hi')}: {value?: T}) {
  return <div>{String(value)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
