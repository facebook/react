import React from 'react';

const useClientSideOnlyHook = () => {
  throw new Error('This hook must be used in a client-side context.');
};

describe('Server-side rendering of async components', () => {
  it('throws a clear error for async components with invalid hooks', async () => {
    const AsyncComponent = async () => {
      useClientSideOnlyHook();
      return <div>Async Component</div>;
    };

    await expect(async () => {
      await AsyncComponent();
    }).rejects.toThrow(/This hook must be used in a client-side context/);
  });
});
