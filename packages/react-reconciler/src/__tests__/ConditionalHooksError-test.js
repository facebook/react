// packages/react-reconciler/src/__tests__/ConditionalHooksError-test.js

const React = require('react');
const ReactNoop = require('react-noop-renderer');
const act = require('internal-test-utils').act;


function TestComponent({ i }) {
  if (i % 2 === 0) {
    React.useEffect(() => {}, []);
  }
  return <span>{i}</span>;
}

test('Conditional hooks should warn or error when hook count changes', async () => {
  const root = ReactNoop.createRoot();

  await act(() => {
    root.render(<TestComponent i={1} />);
  });

  await expect(async () => {
    await act(() => {
      root.render(<TestComponent i={2} />);
    });
  }).rejects.toThrowError();
});
