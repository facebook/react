import {useState} from 'react';

type TestState = {
  test: string;
};

function Component() {
  const [test, setTest] = useState<TestState | null>(null);

  return (
    <>
      <button
        onClick={() =>
          test == null ? setTest({test: 'test'}) : setTest(null)
        }>
        Toggle
      </button>
      <button disabled={!test} onClick={() => console.log(test!.test)}>
        Print
      </button>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
