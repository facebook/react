function id<T>(x: T): T {
  return x;
}

export function Component<T = string>({fn = id<string>}: {fn?: (x: T) => T}) {
  const value = fn('hi');
  return <div>{String(value)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
