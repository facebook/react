const computedPropKey = 'foobar';

function Bar({obj}: {obj: any}) {
  return <div>{obj[computedPropKey]()}</div>;
}

function Component() {
  return (
    <div>
      <Bar
        obj={{
          [computedPropKey]() {
            return 'Hello';
          },
        }}
      />
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
